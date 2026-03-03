const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail"); // Resend file

// ✅ DEBUG: confirm this file is loaded
console.log("✅ authRoutes.js loaded");

// ✅ helper: ObjectId validation
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ✅ DEBUG route: test => http://localhost:5000/auth/ping
router.get("/ping", (req, res) => {
  res.json({ success: true, message: "pong" });
});

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();
    password = String(password);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    email = String(email).trim().toLowerCase();
    password = String(password);

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET missing in .env",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

/* ================= MASTER STATUS (V2) ================= */
router.get("/master-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId" });
    }

    const user = await User.findById(userId).select("masterPasswordHash");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      isSet: Boolean(user.masterPasswordHash),
    });
  } catch (err) {
    console.error("MASTER STATUS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

/* ================= SET MASTER PASSWORD (V2) ================= */
router.post("/set-master-password", async (req, res) => {
  try {
    let { userId, masterPassword } = req.body || {};

    if (!userId || !masterPassword) {
      return res.status(400).json({
        success: false,
        message: "userId and masterPassword are required",
      });
    }

    userId = String(userId).trim();
    masterPassword = String(masterPassword);

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    if (masterPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Master password must be at least 4 characters",
      });
    }

    const user = await User.findById(userId).select("masterPasswordHash");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.masterPasswordHash) {
      return res.status(400).json({
        success: false,
        message: "Master password already set",
      });
    }

    user.masterPasswordHash = await bcrypt.hash(masterPassword, 12);
    await user.save();

    return res.json({
      success: true,
      message: "Master password set successfully",
    });
  } catch (err) {
    console.error("SET MASTER PASSWORD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

/* ================= VERIFY MASTER PASSWORD (V2) ================= */
router.post("/verify-master-password", async (req, res) => {
  try {
    let { userId, masterPassword } = req.body || {};

    if (!userId || !masterPassword) {
      return res.status(400).json({
        success: false,
        message: "userId and masterPassword are required",
      });
    }

    userId = String(userId).trim();
    masterPassword = String(masterPassword);

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const user = await User.findById(userId).select("masterPasswordHash");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.masterPasswordHash) {
      return res.status(400).json({
        success: false,
        message: "Master password not set",
      });
    }

    const ok = await bcrypt.compare(masterPassword, user.masterPasswordHash);
    if (!ok) {
      return res.status(400).json({
        success: false,
        message: "Wrong master password",
      });
    }

    return res.json({
      success: true,
      message: "Vault unlocked",
    });
  } catch (err) {
    console.error("VERIFY MASTER PASSWORD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

/* ================= FORGOT PASSWORD ================= */
router.post("/forgot-password", async (req, res) => {
  try {
    let { email } = req.body || {};

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    email = String(email).trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    if (!process.env.CLIENT_URL) {
      return res.status(500).json({
        success: false,
        message: "CLIENT_URL missing in .env",
      });
    }

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const message = `
      <h2>Ultra Vault Password Reset</h2>
      <p>Click below link to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 15 minutes.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: "Ultra Vault Password Reset",
      message,
    });

    return res.json({
      success: true,
      message: "Reset link sent to email",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

/* ================= RESET PASSWORD ================= */
router.post("/reset-password/:token", async (req, res) => {
  try {
    let { password } = req.body || {};

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    password = String(password);

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

module.exports = router;