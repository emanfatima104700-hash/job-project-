import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";

function formatSalary(min, max) {
  if (!min && !max) return "Competitive";
  const fmt = (n) => `Rs ${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return min ? `From ${fmt(min)}` : `Up to ${fmt(max)}`;
}

export default function Jobs() {
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: params.get("q") || "",
    category: params.get("category") || "",
    type: params.get("type") || "",
    location: params.get("location") || "",
  });

  useEffect(() => {
    api.get("/jobs/categories").then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    api
      .get("/jobs", { params: query })
      .then((res) => setJobs(res.data.jobs))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const update = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    const sp = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && sp.set(k, v));
    setParams(sp);
  };

  return (
    <div className="page">
      <section className="page-hero page-hero-jobs">
        <div className="container">
          <h1>Browse open roles</h1>
          <p>Filter by skill, location, and work type to find your next move.</p>
        </div>
      </section>

      <div className="container layout-split">
        <aside className="filters">
          <label>
            Search
            <input value={filters.q} onChange={(e) => update("q", e.target.value)} placeholder="Keyword" />
          </label>
          <label>
            Category
            <select value={filters.category} onChange={(e) => update("category", e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Job type
            <select value={filters.type} onChange={(e) => update("type", e.target.value)}>
              <option value="">All</option>
              {["Full-time", "Part-time", "Contract", "Internship", "Remote"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input
              value={filters.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="City or Remote"
            />
          </label>
        </aside>

        <section>
          {loading ? (
            <p className="empty">Loading jobs...</p>
          ) : jobs.length ? (
            <div className="job-list">
              {jobs.map((job) => (
                <Link to={`/jobs/${job.id}`} className="job-row" key={job.id}>
                  <div>
                    <h3>{job.title}</h3>
                    <p>
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <div className="job-row-right">
                    <span className="badge">{job.type}</span>
                    <strong>{formatSalary(job.salary_min, job.salary_max)}</strong>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty">No jobs match your filters.</p>
          )}
        </section>
      </div>
    </div>
  );
}
