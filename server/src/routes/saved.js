import { Router } from "express";
import { getPool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT j.*, s.created_at AS saved_at
       FROM saved_jobs s
       JOIN jobs j ON j.id = s.job_id
       WHERE s.user_id = ? AND j.status = 'approved'
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json({ jobs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch saved jobs" });
  }
});

router.post("/:jobId", authRequired, async (req, res) => {
  try {
    const pool = await getPool();
    await pool.query(
      "INSERT IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)",
      [req.user.id, req.params.jobId]
    );
    res.json({ message: "Job saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save job" });
  }
});

router.delete("/:jobId", authRequired, async (req, res) => {
  try {
    const pool = await getPool();
    await pool.query("DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?", [
      req.user.id,
      req.params.jobId,
    ]);
    res.json({ message: "Job removed from saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to unsave job" });
  }
});

export default router;
