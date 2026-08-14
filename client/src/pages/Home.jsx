import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function formatSalary(min, max) {
  if (!min && !max) return "Competitive";
  const fmt = (n) => `Rs ${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return min ? `From ${fmt(min)}` : `Up to ${fmt(max)}`;
}

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/jobs").then((res) => setJobs(res.data.jobs.slice(0, 6))).catch(() => {});
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div>
      <section className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-overlay" />
        <div className="container hero-content reveal">
          <p className="brand-mark">HireOrbit</p>
          <h1>Find work that moves your career forward</h1>
          <p className="hero-sub">
            Discover curated roles from trusted employers — search smarter, apply faster, grow further.
          </p>
          <form className="hero-search" onSubmit={onSearch}>
            <input
              type="search"
              placeholder="Role, skill, or company"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Search Jobs
            </button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Featured openings</h2>
            <p>Hand-picked roles ready for ambitious professionals.</p>
          </div>
          <div className="job-grid">
            {jobs.map((job, i) => (
              <Link to={`/jobs/${job.id}`} className="job-tile reveal" style={{ animationDelay: `${i * 0.06}s` }} key={job.id}>
                <div className="job-tile-top">
                  <span className="badge">{job.type}</span>
                  <span className="muted">{job.location}</span>
                </div>
                <h3>{job.title}</h3>
                <p className="company">{job.company}</p>
                <div className="job-tile-meta">
                  <span>{job.category}</span>
                  <strong>{formatSalary(job.salary_min, job.salary_max)}</strong>
                </div>
              </Link>
            ))}
          </div>
          {!jobs.length && <p className="empty">No jobs yet. Check back soon.</p>}
          <div className="center-cta">
            <Link to="/jobs" className="btn btn-secondary">
              View all jobs
            </Link>
          </div>
        </div>
      </section>

      <section className="section band">
        <div className="container band-grid">
          <div className="band-copy reveal">
            <h2>Built for seekers and hiring teams</h2>
            <p>
              HireOrbit connects talent with opportunity using a clean workflow — browse, apply, track, and hire with confidence.
            </p>
            <Link to="/register" className="btn btn-primary">
              Create free account
            </Link>
          </div>
          <div className="band-visual reveal" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
