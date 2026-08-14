import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    company_name: row.company_name,
    title: row.title,
    bio: row.bio,
    location: row.location,
    avatar: row.avatar,
    is_active: row.is_active,
    created_at: row.created_at,
  };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, company_name } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const allowedRoles = ["seeker", "employer"];
    const userRole = allowedRoles.includes(role) ? role : "seeker";
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const pool = await getPool();
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing.length) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, company_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.toLowerCase().trim(), hashed, userRole, phone || null, company_name || null]
    );

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    const user = publicUser(rows[0]);
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const pool = await getPool();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (!rows.length) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const safe = publicUser(user);
    res.json({ token: signToken(safe), user: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", authRequired, async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.put("/me", authRequired, async (req, res) => {
  try {
    const { name, phone, company_name, title, bio, location } = req.body;
    const pool = await getPool();
    await pool.query(
      `UPDATE users SET name = COALESCE(?, name), phone = ?, company_name = ?, title = ?, bio = ?, location = ?
       WHERE id = ?`,
      [name || null, phone || null, company_name || null, title || null, bio || null, location || null, req.user.id]
    );
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
