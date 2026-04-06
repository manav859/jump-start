import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { ensureRequiredEnv } from "./config/env.js";
import { ensureAdminAccount } from "./utils/adminBootstrap.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const PORT = process.env.PORT || 5000;

ensureRequiredEnv();

const parseAllowedOrigins = () => {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ALLOWED_ORIGINS,
  ]
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...configuredOrigins,
  ]);
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// Root – so visiting http://localhost:5000/ shows API is up
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Jumpstart API is running",
    endpoints: {
      health: "GET /api/health",
      register: "POST /api/v1/user/auth/register",
      login: "POST /api/v1/user/auth/login",
      socialLogin: "POST /api/v1/user/auth/social-login",
      init: "GET /api/v1/user/init (Bearer token required)",
    },
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Jumpstart API running" });
});

// Mount routes under /api/v1/user
app.use("/api/v1/user/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1", configRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, msg: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, msg: "Server error" });
});

const startServer = async () => {
  await connectDB();
  const adminStatus = await ensureAdminAccount();
  console.log(
    `Admin account ready for ${adminStatus.email}${
      adminStatus.created ? " (created)" : ""
    }`
  );

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the existing process or change PORT in backend/.env.`
      );
      process.exit(1);
    }

    console.error("Server startup error:", error);
    process.exit(1);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
