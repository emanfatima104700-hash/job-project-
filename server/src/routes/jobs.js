import { Router } from "express";
import { getPool } from "../db.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { generateJobDescription } from "../services/openai.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { q, category, type, location, status } = req.query;
    const pool = await getPool();
    const params = [];
    let sql = `
      SELECT j.*, u.name AS employer_name, u.email AS employer_email,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
      FROM jobs j
      JOIN users u ON u.id = j.employer_id
      WHERE 1=1
    `;

    if (!status) {
      sql += " AND j.status = 'approved'";
    } else if (status !== "all") {
      sql += " AND j.status = ?";
      params.push(status);
    }

    if (q) {
      sql += " AND (j.title LIKE ? OR j.company LIKE ? OR j.description LIKE ? OR j.skills LIKE ?)";
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (category) {
      sql += " AND j.category = ?";
      params.push(category);
    }
    if (type) {
      sql += " AND j.type = ?";
      params.push(type);
    }
    if (location) {
      sql += " AND j.location LIKE ?";
      params.push(`%${location}%`);
    }

    sql += " ORDER BY j.created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json({ jobs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

router.get("/categories", async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      "SELECT DISTINCT category FROM jobs WHERE status = 'approved' ORDER BY category"
    );
    res.json({ categories: rows.map((r) => r.category) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.get("/mine", authRequired, requireRole("employer", "admin"), async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT j.*,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
       FROM jobs j
       WHERE j.employer_id = ?
       ORDER BY j.created_at DESC`,
      [req.user.id]
    );
    res.json({ jobs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your jobs" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const pool = await getPool();
    await pool.query("UPDATE jobs SET views = views + 1 WHERE id = ?", [req.params.id]);
    const [rows] = await pool.query(
      `SELECT j.*, u.name AS employer_name, u.email AS employer_email, u.company_name,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
       FROM jobs j
       JOIN users u ON u.id = j.employer_id
       WHERE j.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Job not found" });
    res.json({ job: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch job" });
  }
});

router.post("/generate-description", authRequired, requireRole("employer", "admin"), async (req, res) => {
  try {
    const { title, company, type, location, skills } = req.body;
    if (!title || !company) {
      return res.status(400).json({ message: "Title and company are required" });
    }
    const result = await generateJobDescription({
      title,
      company,
      type: type || "Full-time",
      location: location || "Remote",
      skills,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "AI generation failed" });
  }
});

router.post("/", authRequired, requireRole("employer", "admin"), async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      category,
      salary_min,
      salary_max,
      description,
      requirements,
      benefits,
      skills,
    } = req.body;

    if (!title || !company || !location || !description) {
      return res.status(400).json({ message: "Title, company, location and description are required" });
    }

    const pool = await getPool();
    const status = req.user.role === "admin" ? "approved" : "pending";
    const [result] = await pool.query(
      `INSERT INTO jobs
        (employer_id, title, company, location, type, category, salary_min, salary_max, description, requirements, benefits, skills, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title.trim(),
        company.trim(),
        location.trim(),
        type || "Full-time",
        category || "General",
        salary_min || null,
        salary_max || null,
        description,
        requirements || null,
        benefits || null,
        skills || null,
        status,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM jobs WHERE id = ?", [result.insertId]);
    res.status(201).json({ job: rows[0], message: status === "pending" ? "Job submitted for admin approval" : "Job published" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create job" });
  }
});

router.put("/:id", authRequired, requireRole("employer", "admin"), async (req, res) => {
  try {
    const pool = await getPool();
    const [existing] = await pool.query("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: "Job not found" });
    if (req.user.role !== "admin" && existing[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to edit this job" });
    }

    const j = existing[0];
    const {
      title,
      company,
      location,
      type,
      category,
      salary_min,
      salary_max,
      description,
      requirements,
      benefits,
      skills,
      status,
    } = req.body;

    const nextStatus =
      req.user.role === "admin" && status
        ? status
        : req.user.role === "employer"
          ? "pending"
          : j.status;

    await pool.query(
      `UPDATE jobs SET
        title = ?, company = ?, location = ?, type = ?, category = ?,
        salary_min = ?, salary_max = ?, description = ?, requirements = ?,
        benefits = ?, skills = ?, status = ?
       WHERE id = ?`,
      [
        title ?? j.title,
        company ?? j.company,
        location ?? j.location,
        type ?? j.type,
        category ?? j.category,
        salary_min ?? j.salary_min,
        salary_max ?? j.salary_max,
        description ?? j.description,
        requirements ?? j.requirements,
        benefits ?? j.benefits,
        skills ?? j.skills,
        nextStatus,
        req.params.id,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    res.json({ job: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update job" });
  }
});

router.delete("/:id", authRequired, requireRole("employer", "admin"), async (req, res) => {
  try {
    const pool = await getPool();
    const [existing] = await pool.query("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: "Job not found" });
    if (req.user.role !== "admin" && existing[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to delete this job" });
    }
    await pool.query("DELETE FROM jobs WHERE id = ?", [req.params.id]);
    res.json({ message: "Job deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete job" });
  }
});

export default router;
