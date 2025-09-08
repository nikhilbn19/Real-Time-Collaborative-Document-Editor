import React, { useState } from "react";
import Login from "./componenets/Login";
import DocumentList from "./componenets/DocumentList";
import Editor from "./componenets/Editor";

function App() {
  const [user, setUser] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  if (!user) return <Login onLogin={setUser} />;
  if (!selectedDoc)
    return <DocumentList user={user} onSelect={setSelectedDoc} />;
  return (
    <Editor
      user={user}
      documentId={selectedDoc.id}
      onBack={() => setSelectedDoc(null)}
    />
  );
}

export default App;
