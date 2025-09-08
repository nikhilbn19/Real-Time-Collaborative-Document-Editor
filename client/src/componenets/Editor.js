import React, { useEffect, useState, useRef } from "react";
import { socket } from "../context/SocketContext";
import api from "../api/api";
import Chat from "./Chat";

function Editor({ user, documentId, onBack }) {
  const [content, setContent] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const textRef = useRef();

  // Join document room
  useEffect(() => {
    socket.emit("join_doc", { docId: documentId, username: user.username });

    // Document load
    socket.on("document_load", (data) => {
      setContent(data.document.content || "");
    });

    // Remote edits
    socket.on("remote_edit", (payload) => {
      setContent(payload.content);
    });

    // Presence updates
    socket.on("presence_update", (p) => {
      setActiveUsers(p.members);
    });

    // Cleanup on leave
    return () => {
      socket.emit("leave_doc", { docId: documentId, username: user.username });
      socket.off("document_load");
      socket.off("remote_edit");
      socket.off("presence_update");
    };
  }, [documentId, user.username]);

  // Handle local edits
  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    socket.emit("edit", { docId: documentId, content: newContent });
  };

  // Cursor updates
  const handleCursor = () => {
    const pos = textRef.current.selectionStart;
    socket.emit("cursor_update", {
      docId: documentId,
      cursor: { position: pos },
    });
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left side: Editor */}
      <div style={{ flex: 2, padding: "20px" }}>
        <button onClick={onBack}>← Back</button>
        <h2>Document {documentId}</h2>
        <textarea
          ref={textRef}
          style={{ width: "100%", height: "60vh" }}
          value={content}
          onChange={handleChange}
          onClick={handleCursor}
          onKeyUp={handleCursor}
        />
        <div>
          <h3>Active Users</h3>
          <ul>
            {activeUsers.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right side: Chat */}
      <div style={{ flex: 1, borderLeft: "1px solid gray", padding: "20px" }}>
        <Chat user={user} documentId={documentId} />
      </div>
    </div>
  );
}

export default Editor;
