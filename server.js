require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");




const rateLimit = require("express-rate-limit");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.use(helmet());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Try again later."
});

app.use("/auth/login", loginLimiter);

app.use("/auth/login", loginLimiter);

const authRoutes = require("./routes/authRoutes");
const credentialRoutes = require("./routes/credentialRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // 🔥 JSON parser always before routes

// Routes
app.use("/auth", authRoutes);
app.use("/api/credentials", credentialRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});