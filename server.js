require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

console.log("✅ server.js loaded");
console.log("✅ USING authRoutes FILE =>", require.resolve("./routes/authRoutes"));
console.log(
  "✅ USING credentialRoutes FILE =>",
  require.resolve("./routes/credentialRoutes")
);

const authRoutes = require("./routes/authRoutes");
const credentialRoutes = require("./routes/credentialRoutes");

console.log("✅ authRoutes imported type:", typeof authRoutes);

const app = express();

/* =======================================================
   🔐 TRUST PROXY
======================================================= */
app.set("trust proxy", 1);

/* =======================================================
   🔐 SECURITY
======================================================= */
app.use(helmet());

/* =======================================================
   🌍 CORS (SAFE)
======================================================= */
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

/* =======================================================
   BODY PARSER
======================================================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =======================================================
   🔒 RATE LIMITER
======================================================= */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/auth/login", loginLimiter);

/* =======================================================
   ✅ HEALTH CHECK ROUTES (SERVER LEVEL)
======================================================= */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Ultra-Vault API is running successfully!",
  });
});

app.get("/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "pong-from-server.js (/ping)",
    time: new Date(),
  });
});

/* =======================================================
   🚀 ROUTES
======================================================= */
console.log("✅ mounting /auth routes...");
app.use("/auth", authRoutes);

console.log("✅ mounting /api/credentials routes...");
app.use("/api/credentials", credentialRoutes);

/* =======================================================
   ❌ 404 HANDLER
======================================================= */
app.use((req, res) => {
  console.log("❌ Route not found:", req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

/* =======================================================
   🌍 DATABASE CONNECTION + START
======================================================= */
const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.log("❌ MONGO_URI missing in .env");
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log("=====================================");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("=====================================");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);

    // Server ko phir bhi chala do (debug ke liye)
    app.listen(PORT, () => {
      console.log("=====================================");
      console.log(`🚀 Server running on port ${PORT} (DB NOT CONNECTED)`);
      console.log("=====================================");
    });
  });