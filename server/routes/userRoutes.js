const express = require("express");
const {
  login,
  getActiveUsers,
  logout,
} = require("../controllers/userController");

const router = express.Router();

router.post("/login", login);
router.get("/active", getActiveUsers);
router.post("/logout", logout);

module.exports = router;
