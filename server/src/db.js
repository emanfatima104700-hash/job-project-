import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

function toPgParams(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function normalizeSql(sql) {
  let text = sql.replace(/`/g, "");

  if (/INSERT\s+IGNORE/i.test(text)) {
    text = text.replace(/INSERT\s+IGNORE/i, "INSERT");
    if (!/ON CONFLICT/i.test(text)) {
      text += " ON CONFLICT DO NOTHING";
    }
  }

  const isInsert = /^\s*INSERT/i.test(text);
  if (isInsert && !/RETURNING/i.test(text)) {
    text = `${text.replace(/;?\s*$/, "")} RETURNING id`;
  }

  return text;
}

export async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL missing. Get it from Supabase → Project Settings → Database → Connection string (URI)."
    );
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const db = {
    async query(sql, params = []) {
      const text = toPgParams(normalizeSql(sql));
      const result = await pool.query(text, params);
      const meta = {
        insertId: result.rows[0]?.id ?? 0,
        affectedRows: result.rowCount || 0,
        rowCount: result.rowCount || 0,
      };
      return [result.rows, meta];
    },
    async end() {
      await pool.end();
    },
  };

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'seeker' CHECK (role IN ('seeker', 'employer', 'admin')),
      phone VARCHAR(40) DEFAULT NULL,
      company_name VARCHAR(180) DEFAULT NULL,
      title VARCHAR(180) DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      location VARCHAR(180) DEFAULT NULL,
      avatar VARCHAR(255) DEFAULT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      employer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      company VARCHAR(180) NOT NULL,
      location VARCHAR(180) NOT NULL,
      type VARCHAR(30) NOT NULL DEFAULT 'Full-time'
        CHECK (type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote')),
      category VARCHAR(100) NOT NULL DEFAULT 'General',
      salary_min INT DEFAULT NULL,
      salary_max INT DEFAULT NULL,
      description TEXT NOT NULL,
      requirements TEXT DEFAULT NULL,
      benefits TEXT DEFAULT NULL,
      skills VARCHAR(500) DEFAULT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'closed')),
      views INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      seeker_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cover_letter TEXT DEFAULT NULL,
      resume_url VARCHAR(255) DEFAULT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (job_id, seeker_id)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, job_id)
    )
  `);

  return db;
}

let poolPromise = null;

export function getPool() {
  if (!poolPromise) {
    poolPromise = initDatabase();
  }
  return poolPromise;
}
