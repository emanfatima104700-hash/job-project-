import { Router } from "express";
import bcrypt from "bcryptjs";
import { getPool } from "../db.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authRequired, requireRole("admin"));

router.get("/stats", async (_req, res) => {
  try {
    const pool = await getPool();
    const [[users]] = await pool.query("SELECT COUNT(*) AS total FROM users");
    const [[seekers]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'seeker'");
    const [[employers]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'employer'");
    const [[jobs]] = await pool.query("SELECT COUNT(*) AS total FROM jobs");
    const [[pendingJobs]] = await pool.query("SELECT COUNT(*) AS total FROM jobs WHERE status = 'pending'");
    const [[approvedJobs]] = await pool.query("SELECT COUNT(*) AS total FROM jobs WHERE status = 'approved'");
    const [[applications]] = await pool.query("SELECT COUNT(*) AS total FROM applications");

    const [recentJobs] = await pool.query(
      `SELECT id, title, company, status, created_at FROM jobs ORDER BY created_at DESC LIMIT 5`
    );
    const [recentApps] = await pool.query(
      `SELECT a.id, a.status, a.created_at, j.title AS job_title, u.name AS seeker_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u ON u.id = a.seeker_id
       ORDER BY a.created_at DESC LIMIT 5`
    );

    res.json({
      stats: {
        users: users.total,
        seekers: seekers.total,
        employers: employers.total,
        jobs: jobs.total,
        pendingJobs: pendingJobs.total,
        approvedJobs: approvedJobs.total,
        applications: applications.total,
      },
      recentJobs,
      recentApps,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const pool = await getPool();
    const { role } = req.query;
    let sql = "SELECT id, name, email, role, phone, company_name, location, is_active, created_at FROM users";
    const params = [];
    if (role) {
      sql += " WHERE role = ?";
      params.push(role);
    }
    sql += " ORDER BY created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const { is_active, role } = req.body;
    const pool = await getPool();
    const [existing] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: "User not found" });

    const nextActive = typeof is_active === "boolean" || is_active === 0 || is_active === 1 ? Number(is_active) : existing[0].is_active;
    const nextRole = ["seeker", "employer", "admin"].includes(role) ? role : existing[0].role;

    await pool.query("UPDATE users SET is_active = ?, role = ? WHERE id = ?", [
      nextActive,
      nextRole,
      req.params.id,
    ]);

    const [rows] = await pool.query(
      "SELECT id, name, email, role, phone, company_name, location, is_active, created_at FROM users WHERE id = ?",
      [req.params.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }
    const pool = await getPool();
    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

router.get("/jobs", async (req, res) => {
  try {
    const pool = await getPool();
    const { status } = req.query;
    let sql = `
      SELECT j.*, u.name AS employer_name, u.email AS employer_email,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
      FROM jobs j
      JOIN users u ON u.id = j.employer_id
    `;
    const params = [];
    if (status) {
      sql += " WHERE j.status = ?";
      params.push(status);
    }
    sql += " ORDER BY j.created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json({ jobs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

router.patch("/jobs/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "approved", "rejected", "closed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const pool = await getPool();
    const [existing] = await pool.query("SELECT id FROM jobs WHERE id = ?", [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: "Job not found" });
    await pool.query("UPDATE jobs SET status = ? WHERE id = ?", [status, req.params.id]);
    const [rows] = await pool.query("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    res.json({ job: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update job status" });
  }
});

router.delete("/jobs/:id", async (req, res) => {
  try {
    const pool = await getPool();
    await pool.query("DELETE FROM jobs WHERE id = ?", [req.params.id]);
    res.json({ message: "Job deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete job" });
  }
});

router.get("/applications", async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT a.*, j.title AS job_title, j.company, u.name AS seeker_name, u.email AS seeker_email
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u ON u.id = a.seeker_id
       ORDER BY a.created_at DESC`
    );
    res.json({ applications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

router.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }
    const pool = await getPool();
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing.length) return res.status(409).json({ message: "Email already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
      [name, email.toLowerCase(), hashed]
    );
    res.status(201).json({ id: result.insertId, message: "Admin created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create admin" });
  }
});

export default router;
