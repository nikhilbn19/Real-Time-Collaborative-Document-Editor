import React, { useEffect, useState } from "react";
import { socket } from "../context/SocketContext";
import api from "../api/api";

function Chat({ user, documentId }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [typingUser, setTypingUser] = useState(null);

  // Load chat history
  useEffect(() => {
    const fetchHistory = async () => {
      const res = await api.get(`/documents/${documentId}/chat?limit=20`);
      setMessages(res.data.chatHistory || []);
    };
    fetchHistory();

    // Listen for new messages
    socket.on("new_chat", (m) => {
      setMessages((prev) => [...prev, m]);
    });

    // Typing indicator
    socket.on("chat_typing", ({ username }) => {
      if (username !== user.username) {
        setTypingUser(username);
        setTimeout(() => setTypingUser(null), 2000);
      }
    });

    return () => {
      socket.off("new_chat");
      socket.off("chat_typing");
    };
  }, [documentId, user.username]);

  const sendMessage = () => {
    if (!msg) return;
    socket.emit("chat_message", {
      docId: documentId,
      username: user.username,
      message: msg,
    });
    setMsg("");
  };

  const handleTyping = () => {
    socket.emit("chat_typing", { docId: documentId, username: user.username });
  };

  return (
    <div>
      <h3>Chat</h3>
      <div
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "auto",
          padding: "5px",
        }}
      >
        {messages.map((m) => (
          <div key={m.id}>
            <b>{m.username}</b>: {m.message}
          </div>
        ))}
      </div>
      {typingUser && (
        <div style={{ fontStyle: "italic" }}>{typingUser} is typing...</div>
      )}
      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        onKeyUp={handleTyping}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;
