import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
};

export async function initDatabase() {
  const connection = await mysql.createConnection(dbConfig);
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "job_portal"}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();

  const pool = mysql.createPool({
    ...dbConfig,
    database: process.env.DB_NAME || "job_portal",
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('seeker', 'employer', 'admin') NOT NULL DEFAULT 'seeker',
      phone VARCHAR(40) DEFAULT NULL,
      company_name VARCHAR(180) DEFAULT NULL,
      title VARCHAR(180) DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      location VARCHAR(180) DEFAULT NULL,
      avatar VARCHAR(255) DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employer_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      company VARCHAR(180) NOT NULL,
      location VARCHAR(180) NOT NULL,
      type ENUM('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote') NOT NULL DEFAULT 'Full-time',
      category VARCHAR(100) NOT NULL DEFAULT 'General',
      salary_min INT DEFAULT NULL,
      salary_max INT DEFAULT NULL,
      description TEXT NOT NULL,
      requirements TEXT DEFAULT NULL,
      benefits TEXT DEFAULT NULL,
      skills VARCHAR(500) DEFAULT NULL,
      status ENUM('pending', 'approved', 'rejected', 'closed') NOT NULL DEFAULT 'pending',
      views INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id INT NOT NULL,
      seeker_id INT NOT NULL,
      cover_letter TEXT DEFAULT NULL,
      resume_url VARCHAR(255) DEFAULT NULL,
      status ENUM('pending', 'reviewed', 'shortlisted', 'rejected', 'hired') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_application (job_id, seeker_id),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      job_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_save (user_id, job_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `);

  return pool;
}

let poolPromise = null;

export function getPool() {
  if (!poolPromise) {
    poolPromise = initDatabase();
  }
  return poolPromise;
}
