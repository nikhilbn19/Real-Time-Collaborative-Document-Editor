import React, { useEffect, useState } from "react";
import api from "../api/api";

function DocumentList({ user, onSelect }) {
  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    const res = await api.get("/documents");
    setDocs(res.data.documents);
  };

  const createDoc = async () => {
    if (!title) return;
    const res = await api.post("/documents", { title });
    setTitle("");
    fetchDocs();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome, {user.username}</h2>
      <h3>Documents</h3>
      <input
        placeholder="New document title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button onClick={createDoc}>Create</button>

      <ul>
        {docs.map((doc) => (
          <li key={doc.id}>
            <button onClick={() => onSelect(doc)}>
              {doc.title} (Active: {doc.activeParticipants})
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DocumentList;
