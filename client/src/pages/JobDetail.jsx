import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get(`/jobs/${id}`)
      .then((res) => setJob(res.data.job))
      .catch(() => setError("Job not found"));
  }, [id]);

  const improveLetter = async () => {
    if (!user) return navigate("/login");
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/applications/improve-cover-letter", {
        jobTitle: job.title,
        company: job.company,
        draft: coverLetter,
      });
      setCoverLetter(data.cover_letter);
    } catch (err) {
      setError(err.response?.data?.message || "AI assist failed");
    } finally {
      setBusy(false);
    }
  };

  const apply = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (user.role !== "seeker") {
      setError("Only job seekers can apply");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("job_id", id);
      form.append("cover_letter", coverLetter);
      if (resume) form.append("resume", resume);
      const { data } = await api.post("/applications", form);
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Application failed");
    } finally {
      setBusy(false);
    }
  };

  const saveJob = async () => {
    if (!user) return navigate("/login");
    try {
      await api.post(`/saved/${id}`);
      setMessage("Job saved to your list");
    } catch {
      setError("Could not save job");
    }
  };

  if (error && !job) {
    return (
      <div className="container page">
        <p className="empty">{error}</p>
        <Link to="/jobs">Back to jobs</Link>
      </div>
    );
  }

  if (!job) return <div className="page-loading">Loading job...</div>;

  return (
    <div className="page">
      <section className="page-hero page-hero-detail">
        <div className="container">
          <p className="eyebrow">{job.company}</p>
          <h1>{job.title}</h1>
          <p>
            {job.location} · {job.type} · {job.category}
          </p>
        </div>
      </section>

      <div className="container detail-grid">
        <article className="detail-main">
          <h2>About the role</h2>
          <p className="pre">{job.description}</p>
          {job.requirements && (
            <>
              <h3>Requirements</h3>
              <p className="pre">{job.requirements}</p>
            </>
          )}
          {job.benefits && (
            <>
              <h3>Benefits</h3>
              <p className="pre">{job.benefits}</p>
            </>
          )}
          {job.skills && (
            <>
              <h3>Skills</h3>
              <div className="skill-row">
                {job.skills.split(",").map((s) => (
                  <span key={s} className="chip">
                    {s.trim()}
                  </span>
                ))}
              </div>
            </>
          )}
        </article>

        <aside className="detail-side">
          <div className="panel">
            <h3>Quick facts</h3>
            <ul className="facts">
              <li>
                <span>Salary</span>
                <strong>
                  {job.salary_min || job.salary_max
                    ? `Rs ${job.salary_min || "—"} – ${job.salary_max || "—"}`
                    : "Competitive"}
                </strong>
              </li>
              <li>
                <span>Applicants</span>
                <strong>{job.application_count || 0}</strong>
              </li>
              <li>
                <span>Views</span>
                <strong>{job.views}</strong>
              </li>
            </ul>
            <button type="button" className="btn btn-secondary btn-block" onClick={saveJob}>
              Save job
            </button>
          </div>

          {user?.role === "seeker" && (
            <form className="panel apply-form" onSubmit={apply}>
              <h3>Apply now</h3>
              <label>
                Cover letter
                <textarea
                  rows={7}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell them why you're a great fit"
                />
              </label>
              <button type="button" className="btn btn-ghost btn-block" onClick={improveLetter} disabled={busy}>
                Improve with AI
              </button>
              <label>
                Resume (PDF/DOC)
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files[0])} />
              </label>
              {error && <p className="form-error">{error}</p>}
              {message && <p className="form-success">{message}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? "Submitting..." : "Submit application"}
              </button>
            </form>
          )}

          {!user && (
            <div className="panel">
              <p>Sign in as a job seeker to apply.</p>
              <Link to="/login" className="btn btn-primary btn-block">
                Sign in
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
