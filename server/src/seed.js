import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { getPool } from "./db.js";

dotenv.config();

async function seed() {
  const pool = await getPool();
  console.log("Seeding database...");

  const adminPass = await bcrypt.hash("Admin@123", 10);
  const employerPass = await bcrypt.hash("Employer@123", 10);
  const seekerPass = await bcrypt.hash("Seeker@123", 10);

  await pool.query(
    `INSERT INTO users (name, email, password, role, phone, company_name, title, location, bio)
     VALUES (?, ?, ?, 'admin', ?, NULL, 'Platform Administrator', 'Karachi', 'System admin')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    ["Admin User", "admin@jobportal.com", adminPass, "+92-300-0000001"]
  );

  await pool.query(
    `INSERT INTO users (name, email, password, role, phone, company_name, title, location, bio)
     VALUES (?, ?, ?, 'employer', ?, ?, 'Hiring Manager', 'Lahore', 'Building high-performing teams')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    ["Sara Ahmed", "employer@nova.com", employerPass, "+92-300-0000002", "NovaTech Solutions"]
  );

  await pool.query(
    `INSERT INTO users (name, email, password, role, phone, company_name, title, location, bio)
     VALUES (?, ?, ?, 'employer', ?, ?, 'Talent Lead', 'Islamabad', 'Product-led growth company')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    ["Ali Raza", "employer@pixelcraft.com", employerPass, "+92-300-0000003", "PixelCraft Studio"]
  );

  await pool.query(
    `INSERT INTO users (name, email, password, role, phone, company_name, title, location, bio)
     VALUES (?, ?, ?, 'seeker', ?, NULL, 'Full Stack Developer', 'Karachi', 'React & Node specialist')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    ["Hassan Khan", "seeker@mail.com", seekerPass, "+92-300-0000004"]
  );

  const [employers] = await pool.query(
    "SELECT id, company_name FROM users WHERE role = 'employer' ORDER BY id ASC"
  );
  const [jobCount] = await pool.query("SELECT COUNT(*) AS c FROM jobs");

  if (jobCount[0].c === 0 && employers.length >= 2) {
    const jobs = [
      {
        employer_id: employers[0].id,
        title: "Senior React Developer",
        company: employers[0].company_name,
        location: "Lahore / Hybrid",
        type: "Full-time",
        category: "Engineering",
        salary_min: 180000,
        salary_max: 280000,
        description:
          "NovaTech is looking for a Senior React Developer to own complex UI systems, mentor junior engineers, and ship polished product experiences.",
        requirements:
          "• 4+ years React experience\n• Strong TypeScript & state management skills\n• Experience with REST APIs and testing\n• Excellent communication",
        benefits: "• Competitive salary\n• Hybrid work\n• Learning budget\n• Health coverage",
        skills: "React, TypeScript, Redux, Node.js",
        status: "approved",
      },
      {
        employer_id: employers[0].id,
        title: "Backend Node.js Engineer",
        company: employers[0].company_name,
        location: "Remote",
        type: "Full-time",
        category: "Engineering",
        salary_min: 160000,
        salary_max: 250000,
        description:
          "Design and build scalable APIs, authentication flows, and data services powering our job marketplace platform.",
        requirements:
          "• Strong Node.js & Express experience\n• MySQL/PostgreSQL proficiency\n• JWT auth & security best practices\n• Clean architecture mindset",
        benefits: "• Remote-first culture\n• Flexible hours\n• Annual bonus\n• Equipment stipend",
        skills: "Node.js, Express, MySQL, JWT",
        status: "approved",
      },
      {
        employer_id: employers[1].id,
        title: "UI/UX Designer",
        company: employers[1].company_name,
        location: "Islamabad",
        type: "Full-time",
        category: "Design",
        salary_min: 120000,
        salary_max: 200000,
        description:
          "Craft elegant interfaces and design systems for web products used by thousands of professionals every day.",
        requirements:
          "• 3+ years product design experience\n• Figma mastery\n• Strong visual & interaction design sense\n• Portfolio required",
        benefits: "• Creative freedom\n• Design tools budget\n• Collaborative culture\n• Career growth path",
        skills: "Figma, UI Design, Prototyping, Design Systems",
        status: "approved",
      },
      {
        employer_id: employers[1].id,
        title: "Digital Marketing Specialist",
        company: employers[1].company_name,
        location: "Karachi",
        type: "Part-time",
        category: "Marketing",
        salary_min: 70000,
        salary_max: 110000,
        description:
          "Own campaign performance across paid and organic channels and help grow brand awareness for PixelCraft.",
        requirements:
          "• Hands-on Google Ads & Meta Ads experience\n• Strong analytics skills\n• Content collaboration ability\n• 2+ years marketing experience",
        benefits: "• Flexible schedule\n• Performance bonuses\n• Training support",
        skills: "SEO, Google Ads, Analytics, Content",
        status: "approved",
      },
      {
        employer_id: employers[0].id,
        title: "QA Automation Intern",
        company: employers[0].company_name,
        location: "Lahore",
        type: "Internship",
        category: "Engineering",
        salary_min: 40000,
        salary_max: 60000,
        description:
          "Join our QA team to learn test automation, write reliable test suites, and improve product quality.",
        requirements:
          "• Basic JavaScript knowledge\n• Curiosity about testing\n• Willingness to learn\n• Currently enrolled or recent graduate",
        benefits: "• Mentorship\n• Certificate\n• Possible full-time conversion",
        skills: "JavaScript, Testing, Cypress basics",
        status: "pending",
      },
    ];

    for (const job of jobs) {
      await pool.query(
        `INSERT INTO jobs
          (employer_id, title, company, location, type, category, salary_min, salary_max, description, requirements, benefits, skills, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          job.employer_id,
          job.title,
          job.company,
          job.location,
          job.type,
          job.category,
          job.salary_min,
          job.salary_max,
          job.description,
          job.requirements,
          job.benefits,
          job.skills,
          job.status,
        ]
      );
    }
  }

  console.log("Seed complete.");
  console.log("Admin: admin@jobportal.com / Admin@123");
  console.log("Employer: employer@nova.com / Employer@123");
  console.log("Seeker: seeker@mail.com / Seeker@123");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
