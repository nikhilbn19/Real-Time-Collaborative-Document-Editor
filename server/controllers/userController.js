const db = require("../db");
const redis = require("../redis");

// Login / Register user
async function login(req, res) {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if user exists
    let user = await db("users").where({ username }).first();

    if (!user) {
      // Insert new user
      const [id] = await db("users").insert({ username }).returning("id");
      user = { id, username };
    }

    // Increment user session count in Redis
    await redis.incr(`user:${username}:sessions`);

    // Add to Redis active users set
    await redis.sadd("active_users", username);

    return res.json({ message: "Login successful", user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get active users
async function getActiveUsers(req, res) {
  try {
    const users = await redis.smembers("active_users");
    return res.json({ activeUsers: users });
  } catch (err) {
    console.error("Active users fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Logout user (remove from Redis)
async function logout(req, res) {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    // Decrement session count
    const sessionsLeft = await redis.decr(`user:${username}:sessions`);
    if (sessionsLeft <= 0) {
      await redis.srem("active_users", username);
    }

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { login, getActiveUsers, logout };
