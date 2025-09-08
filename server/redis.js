const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  tls: {},
  maxRetriesPerRequest: null,
  reconnectOnError: () => true,
  connectTimeout: 10000,
  lazyConnect: false,
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

module.exports = redis;
