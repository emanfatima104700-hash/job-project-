-- HireOrbit tables for Supabase (auto-created by server too)

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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);
