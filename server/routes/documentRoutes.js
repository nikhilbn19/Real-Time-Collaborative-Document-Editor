const express = require("express");
const {
  createDocument,
  listDocuments,
  loadDocument,
  getChatHistory,
} = require("../controllers/documentController");

const router = express.Router();

router.post("/", createDocument);
router.get("/", listDocuments);
router.get("/:id", loadDocument);
router.get("/:id/chat", getChatHistory);

module.exports = router;
