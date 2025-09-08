// controllers/documentController.js
const db = require("../db");
const redis = require("../redis");

// Create a new document
async function createDocument(req, res) {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const [doc] = await db("documents")
      .insert({ title })
      .returning(["id", "title", "content", "last_edited"]);

    return res.json({ message: "Document created", document: doc });
  } catch (err) {
    console.error("Create Document Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// List all documents
async function listDocuments(req, res) {
  try {
    const docs = await db("documents").select("id", "title", "last_edited");

    // Get active participants for each doc from Redis
    for (let doc of docs) {
      const activeUsers = await redis.smembers(`doc:${doc.id}:users`);
      doc.activeParticipants = activeUsers.length;
    }

    return res.json({ documents: docs });
  } catch (err) {
    console.error("List Documents Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Load a document with chat history
async function loadDocument(req, res) {
  try {
    const { id } = req.params;

    const doc = await db("documents").where({ id }).first();
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Get last 20 chat messages (can be configurable)
    const chats = await db("chat_messages")
      .join("users", "chat_messages.user_id", "users.id")
      .where("document_id", id)
      .select(
        "chat_messages.id",
        "users.username",
        "chat_messages.message",
        "chat_messages.created_at"
      )
      .orderBy("chat_messages.created_at", "desc")
      .limit(20);

    return res.json({ document: doc, chatHistory: chats.reverse() });
  } catch (err) {
    console.error("Load Document Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get chat history separately (with limit option)
async function getChatHistory(req, res) {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 20; // default last 20

    const chats = await db("chat_messages")
      .join("users", "chat_messages.user_id", "users.id")
      .where("document_id", id)
      .select(
        "chat_messages.id",
        "users.username",
        "chat_messages.message",
        "chat_messages.created_at"
      )
      .orderBy("chat_messages.created_at", "desc")
      .limit(limit);

    return res.json({ chatHistory: chats.reverse() }); // reverse so oldest → newest
  } catch (err) {
    console.error("Get Chat History Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  createDocument,
  listDocuments,
  loadDocument,
  getChatHistory,
};
