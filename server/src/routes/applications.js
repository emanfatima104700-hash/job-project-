import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { getPool } from "../db.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { improveCoverLetter } from "../services/openai.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.VERCEL
  ? path.join("/tmp", "resumes")
  : path.join(__dirname, "../../uploads/resumes");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Only PDF, DOC, DOCX resumes are allowed"));
    }
    cb(null, true);
  },
});

router.post("/improve-cover-letter", authRequired, requireRole("seeker", "admin"), async (req, res) => {
  try {
    const { jobTitle, company, draft } = req.body;
    const text = await improveCoverLetter({
      jobTitle: jobTitle || "the role",
      company: company || "the company",
      name: req.user.name,
      draft,
    });
    res.json({ cover_letter: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to improve cover letter" });
  }
});

router.post("/", authRequired, requireRole("seeker"), upload.single("resume"), async (req, res) => {
  try {
    const { job_id, cover_letter } = req.body;
    if (!job_id) return res.status(400).json({ message: "job_id is required" });

    const pool = await getPool();
    const [jobs] = await pool.query("SELECT * FROM jobs WHERE id = ? AND status = 'approved'", [job_id]);
    if (!jobs.length) return res.status(404).json({ message: "Job not available" });

    const [dup] = await pool.query(
      "SELECT id FROM applications WHERE job_id = ? AND seeker_id = ?",
      [job_id, req.user.id]
    );
    if (dup.length) return res.status(409).json({ message: "You already applied to this job" });

    const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : null;
    const [result] = await pool.query(
      `INSERT INTO applications (job_id, seeker_id, cover_letter, resume_url)
       VALUES (?, ?, ?, ?)`,
      [job_id, req.user.id, cover_letter || null, resumeUrl]
    );

    const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [result.insertId]);
    res.status(201).json({ application: rows[0], message: "Application submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to apply" });
  }
});

router.get("/mine", authRequired, requireRole("seeker", "admin"), async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT a.*, j.title, j.company, j.location, j.type, j.status AS job_status
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.seeker_id = ?
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json({ applications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

router.get("/job/:jobId", authRequired, requireRole("employer", "admin"), async (req, res) => {
  try {
    const pool = await getPool();
    const [jobs] = await pool.query("SELECT * FROM jobs WHERE id = ?", [req.params.jobId]);
    if (!jobs.length) return res.status(404).json({ message: "Job not found" });
    if (req.user.role !== "admin" && jobs[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const [rows] = await pool.query(
      `SELECT a.*, u.name AS seeker_name, u.email AS seeker_email, u.phone AS seeker_phone, u.title AS seeker_title
       FROM applications a
       JOIN users u ON u.id = a.seeker_id
       WHERE a.job_id = ?
       ORDER BY a.created_at DESC`,
      [req.params.jobId]
    );
    res.json({ applications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch applicants" });
  }
});

router.patch("/:id/status", authRequired, requireRole("employer", "admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "reviewed", "shortlisted", "rejected", "hired"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT a.*, j.employer_id FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Application not found" });
    if (req.user.role !== "admin" && rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await pool.query("UPDATE applications SET status = ? WHERE id = ?", [status, req.params.id]);
    const [updated] = await pool.query("SELECT * FROM applications WHERE id = ?", [req.params.id]);
    res.json({ application: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

export default router;
