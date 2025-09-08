const redis = require("./redis");
const { Server } = require("socket.io");

async function cleanupPresence(io) {
  const keys = await redis.keys("doc:*:presence:*");
  for (const key of keys) {
    const isActive = await redis.get(key);
    if (!isActive) {
      // Key expired, remove user from doc set
      const parts = key.split(":"); // doc:123:presence:alice
      const docId = parts[1];
      const username = parts[3];
      await redis.srem(`doc:${docId}:users`, username);

      const members = await redis.smembers(`doc:${docId}:users`);
      io.to(`doc_${docId}`).emit("presence_update", { docId, members });
    }
  }
}

module.exports = cleanupPresence;
