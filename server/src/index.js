import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getPool } from "./db.js";
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applications.js";
import adminRoutes from "./routes/admin.js";
import savedRoutes from "./routes/saved.js";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const allowed = [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
    "http://localhost:5173",
    "http://localhost:5174",
  ].filter(Boolean);
  if (allowed.includes(origin)) return true;
  if (/\.vercel\.app$/i.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(async (_req, _res, next) => {
  try {
    await getPool();
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "JobPortal API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/saved", savedRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

export default app;

if (!process.env.VERCEL) {
  getPool()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start server:", err.message);
      process.exit(1);
    });
}
