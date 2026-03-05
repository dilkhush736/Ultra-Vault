const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Credential = require("../models/credential"); // filename case check

// ✅ later: router.use(requireAdmin)

// ================= USERS =================
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= CREDENTIALS =================
router.get("/credentials", async (req, res) => {
  try {
    // ❌ NEVER send password/encrypted password
   const creds = await Credential.find({})
  .populate("user", "name email")
.select("_id platform email user createdAt")
  .sort({ createdAt: -1 });

    return res.json({ success: true, data: creds });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;