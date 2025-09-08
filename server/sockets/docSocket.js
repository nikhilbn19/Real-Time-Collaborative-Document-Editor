// server/sockets/docSocket.js
const db = require("../db");
const redis = require("../redis");

const SAVE_DEBOUNCE_MS = 2000; // wait after last edit to persist

// in-memory map to hold latest content per doc and pending timers
const docBuffers = new Map(); // docId -> { content, timer }

function scheduleSave(docId) {
  const buffer = docBuffers.get(docId);
  if (!buffer) return;

  if (buffer.timer) clearTimeout(buffer.timer);

  buffer.timer = setTimeout(async () => {
    try {
      const { content } = buffer;
      await db("documents")
        .where({ id: docId })
        .update({ content, last_edited: db.fn.now() });

      await redis.del(`doc:${docId}:content`);

      await redis.publish(
        "doc_updates",
        JSON.stringify({ docId, savedAt: new Date().toISOString() })
      );
      console.log(`Document ${docId} persisted to DB.`);
    } catch (err) {
      console.error("Error saving document:", err);
    }
    buffer.timer = null;
  }, SAVE_DEBOUNCE_MS);

  docBuffers.set(docId, buffer);
}

async function getUserIdByUsername(username) {
  if (!username) return null;
  const user = await db("users").where({ username }).first();
  return user ? user.id : null;
}

module.exports = function setupDocSocket(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.data.joinedDocs = new Set();
    socket.data.username = null;

    // ---- Join Document room ----
    socket.on("join_doc", async (payload) => {
      try {
        const { docId, username } = payload || {};
        if (!docId || !username) return;

        socket.data.username = username;
        socket.join(`doc_${docId}`);
        socket.data.joinedDocs.add(String(docId));

        await redis.sadd(`doc:${docId}:users`, username);
        await redis.setex(`doc:${docId}:presence:${username}`, 30, "active");

        // Increment session count and add to global active_users
        await redis.incr(`user:${username}:sessions`);
        await redis.sadd("active_users", username);

        const cached = await redis.get(`doc:${docId}:content`);
        let doc;
        if (cached) {
          doc = JSON.parse(cached);
        } else {
          doc = await db("documents").where({ id: docId }).first();
          if (doc) {
            await redis.set(
              `doc:${docId}:content`,
              JSON.stringify(doc),
              "EX",
              60 * 5
            );
          }
        }

        socket.emit("document_load", { document: doc });

        const members = await redis.smembers(`doc:${docId}:users`);
        io.to(`doc_${docId}`).emit("presence_update", { docId, members });

        console.log(`${username} joined doc ${docId}`);
      } catch (err) {
        console.error("join_doc error:", err);
      }
    });

    // ---- Leave Document room ----
    socket.on("leave_doc", async (payload) => {
      try {
        const { docId, username } = payload || {};
        if (!docId || !username) return;

        socket.leave(`doc_${docId}`);
        socket.data.joinedDocs.delete(String(docId));

        await redis.srem(`doc:${docId}:users`, username);

        const members = await redis.smembers(`doc:${docId}:users`);
        io.to(`doc_${docId}`).emit("presence_update", { docId, members });

        console.log(`${username} left doc ${docId}`);
      } catch (err) {
        console.error("leave_doc error:", err);
      }
    });

    // ---- Edit events ----
    socket.on("edit", async (payload) => {
      try {
        const { docId, content } = payload || {};
        if (!docId || content === undefined) return;

        const existing = docBuffers.get(String(docId)) || {
          content: "",
          timer: null,
        };
        existing.content = content;
        docBuffers.set(String(docId), existing);

        socket
          .to(`doc_${docId}`)
          .emit("remote_edit", { docId, content, from: socket.data.username });

        scheduleSave(String(docId));
      } catch (err) {
        console.error("edit error:", err);
      }
    });

    // ---- Cursor update ----
    socket.on("cursor_update", async (payload) => {
      try {
        const { docId, cursor } = payload || {};
        const username = socket.data.username;
        if (!docId || !cursor || !username) return;

        await redis.setex(
          `doc:${docId}:cursor:${username}`,
          30,
          JSON.stringify(cursor)
        );

        await redis.setex(`doc:${docId}:presence:${username}`, 30, "active");

        socket
          .to(`doc_${docId}`)
          .emit("remote_cursor", { docId, username, cursor });
      } catch (err) {
        console.error("cursor_update error:", err);
      }
    });

    // ---- Chat message ----
    socket.on("chat_message", async (payload) => {
      try {
        const { docId, username, message } = payload || {};
        if (!docId || !username || !message) return;

        const userId = await getUserIdByUsername(username);
        const insert = { document_id: docId, user_id: userId, message };

        const [saved] = await db("chat_messages")
          .insert(insert)
          .returning(["id", "document_id", "user_id", "message", "created_at"]);

        io.to(`doc_${docId}`).emit("new_chat", {
          id: saved.id,
          docId,
          username,
          message: saved.message,
          created_at: saved.created_at,
        });
      } catch (err) {
        console.error("chat_message error:", err);
      }
    });

    // ---- Typing indicators ----
    socket.on("chat_typing", ({ docId, username }) => {
      socket.to(`doc_${docId}`).emit("chat_typing", { username });
    });

    socket.on("editor_typing", ({ docId, username }) => {
      socket.to(`doc_${docId}`).emit("editor_typing", { username });
    });

    // ---- Handle disconnect ----
    socket.on("disconnect", async () => {
      try {
        const username = socket.data.username;

        for (const docId of socket.data.joinedDocs) {
          await redis.srem(`doc:${docId}:users`, username);
          const members = await redis.smembers(`doc:${docId}:users`);
          io.to(`doc_${docId}`).emit("presence_update", { docId, members });
        }

        if (username) {
          const count = await redis.decr(`user:${username}:sessions`);
          if (count <= 0) {
            await redis.srem("active_users", username);
            await redis.del(`user:${username}:sessions`);
          }
        }

        console.log("Socket disconnected:", socket.id, "username:", username);
      } catch (err) {
        console.error("disconnect error:", err);
      }
    });
  });
};
