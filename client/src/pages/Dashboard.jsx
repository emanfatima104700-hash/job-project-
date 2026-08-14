import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [saved, setSaved] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role === "seeker") {
      api.get("/applications/mine").then((res) => setApplications(res.data.applications)).catch(() => {});
      api.get("/saved").then((res) => setSaved(res.data.jobs)).catch(() => {});
    }
    if (user.role === "employer") {
      api.get("/jobs/mine").then((res) => setJobs(res.data.jobs)).catch(() => {});
    }
  }, [user]);

  const loadApplicants = async (jobId) => {
    setSelectedJob(jobId);
    const { data } = await api.get(`/applications/job/${jobId}`);
    setApplicants(data.applications);
  };

  const updateStatus = async (appId, status) => {
    await api.patch(`/applications/${appId}/status`, { status });
    setMessage("Application status updated");
    if (selectedJob) loadApplicants(selectedJob);
  };

  return (
    <div className="page">
      <section className="page-hero page-hero-dash">
        <div className="container">
          <h1>Welcome, {user?.name}</h1>
          <p>
            {user?.role === "employer"
              ? "Manage your job posts and review applicants."
              : "Track applications and saved opportunities."}
          </p>
        </div>
      </section>

      <div className="container">
        {message && <p className="form-success">{message}</p>}

        {user?.role === "seeker" && (
          <>
            <div className="section-head">
              <h2>My applications</h2>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <Link to={`/jobs/${a.job_id}`}>{a.title}</Link>
                      </td>
                      <td>{a.company}</td>
                      <td>
                        <span className={`status status-${a.status}`}>{a.status}</span>
                      </td>
                      <td>{new Date(a.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!applications.length && <p className="empty">No applications yet.</p>}
            </div>

            <div className="section-head" style={{ marginTop: "2.5rem" }}>
              <h2>Saved jobs</h2>
            </div>
            <div className="job-list">
              {saved.map((job) => (
                <Link to={`/jobs/${job.id}`} className="job-row" key={job.id}>
                  <div>
                    <h3>{job.title}</h3>
                    <p>
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <span className="badge">{job.type}</span>
                </Link>
              ))}
              {!saved.length && <p className="empty">No saved jobs.</p>}
            </div>
          </>
        )}

        {user?.role === "employer" && (
          <>
            <div className="section-head row-between">
              <div>
                <h2>Your job posts</h2>
                <p>Pending posts wait for admin approval.</p>
              </div>
              <Link to="/post-job" className="btn btn-primary">
                Post new job
              </Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Applicants</th>
                    <th>Views</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id}>
                      <td>{j.title}</td>
                      <td>
                        <span className={`status status-${j.status}`}>{j.status}</span>
                      </td>
                      <td>{j.application_count}</td>
                      <td>{j.views}</td>
                      <td>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => loadApplicants(j.id)}>
                          View applicants
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!jobs.length && <p className="empty">No jobs posted yet.</p>}
            </div>

            {selectedJob && (
              <div style={{ marginTop: "2rem" }}>
                <h3>Applicants</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants.map((a) => (
                        <tr key={a.id}>
                          <td>{a.seeker_name}</td>
                          <td>{a.seeker_email}</td>
                          <td>
                            <span className={`status status-${a.status}`}>{a.status}</span>
                          </td>
                          <td>
                            <select
                              value={a.status}
                              onChange={(e) => updateStatus(a.id, e.target.value)}
                            >
                              {["pending", "reviewed", "shortlisted", "rejected", "hired"].map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!applicants.length && <p className="empty">No applicants yet.</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
