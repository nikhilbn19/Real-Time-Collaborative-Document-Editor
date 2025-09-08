require("dotenv").config();
const db = require("./db");
const redis = require("./redis");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// routes
const userRoutes = require("./routes/userRoutes");
const documentRoutes = require("./routes/documentRoutes");
const setupDocSocket = require("./sockets/docSocket");
const cleanupPresence = require("./cleanup");

const app = express();
const server = http.createServer(app);

// ---- CORS control ----
const allowedOrigin = process.env.FRONTEND_ORIGIN || "*";

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: false,
  })
);

app.use(express.json());

// API routes
app.use("/api/users", userRoutes);
app.use("/api/documents", documentRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("Real-Time Document Editor Backend Running");
});

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
  },
});

// ✅ Attach doc socket handlers (real-time editing, chat, presence, cursors)
setupDocSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Run cleanup presence every 10 seconds
setInterval(() => cleanupPresence(io), 10000);
