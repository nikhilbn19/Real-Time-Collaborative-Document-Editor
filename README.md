# Real-Time Collaborative Document Editor

A Google Docs–like real-time collaborative editor built as part of the Full Stack Developer Assignment.

---

##  Tech Stack
- **Frontend:** React (Vercel)
- **Backend:** Node.js, Express, Socket.IO (Render)
- **Database:** PostgreSQL (Neon)
- **Cache/Presence:** Redis (Upstash)

---

##  Deployed Links
- **Frontend Demo (Main Link to Submit):**  
  [https://real-time-collaborative-document-ed-psi.vercel.app](https://real-time-collaborative-document-ed-psi.vercel.app/)

- **Backend API (Optional):**  
  [https://real-time-collaborative-document-editor-ekgr.onrender.com](https://real-time-collaborative-document-editor-ekgr.onrender.com)

---

##  Demo Video
[Demo Video](https://www.loom.com/share/373bc262324643069aef2fc7ce8bbed8?sid=ad77d686-e355-4f41-bc51-b18377eb6bdf)
1. Login as two different users  
2. Create a document  
3. Both edit in real-time  
4. Chat syncs instantly  
5. Presence updates when one tab closes  

---

##  Features
- Login with unique username  
- Create & list documents (with last edited timestamp + active participants)  
- Real-time collaborative editing  
- Live cursors + typing indicators  
- Per-document chat (real-time + persisted)  
- Presence tracking via Redis  
- PostgreSQL persistence for documents, users, and chat  

---

##  Running Locally

### 1. Clone the repo
```bash
git clone https://github.com/nikhilbn19/Real-Time-Collaborative-Document-Editor.git
cd Real-Time-Collaborative-Document-Editor
```
2. Backend Setup
cd server
cp .env.example .env
# Fill in POSTGRES_URL and REDIS_URL
npm install
npx knex migrate:latest
npm run dev


Backend runs at http://localhost:5000

3. Frontend Setup
cd ../client
cp .env.example .env
# For local dev:
# REACT_APP_API_BASE=http://localhost:5000/api
# REACT_APP_SOCKET_URL=http://localhost:5000
npm install
npm start


Frontend runs at http://localhost:3000

Project Structure
server/    # Node.js + Express + Socket.IO backend
  ├── migrations/   # Knex migration scripts
  ├── routes/       # REST APIs
  ├── sockets/      # Socket.IO events
  └── redis.js      # Redis client config

client/    # React frontend
  ├── src/components/   # Editor, Chat, etc.
  ├── src/context/      # Socket context
  └── src/api/          # Axios API client
