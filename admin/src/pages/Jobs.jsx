import { useEffect, useState } from "react";
import api from "../api";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");

  const load = () => {
    api
      .get("/admin/jobs", { params: status ? { status } : {} })
      .then((res) => setJobs(res.data.jobs))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [status]);

  const setJobStatus = async (id, next) => {
    await api.patch(`/admin/jobs/${id}/status`, { status: next });
    setMessage(`Job marked as ${next}`);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this job?")) return;
    await api.delete(`/admin/jobs/${id}`);
    setMessage("Job deleted");
    load();
  };

  return (
    <div>
      <div className="toolbar">
        <h2>Jobs moderation</h2>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {message && <p className="success">{message}</p>}
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Company</th>
              <th>Employer</th>
              <th>Status</th>
              <th>Apps</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>{j.title}</td>
                <td>{j.company}</td>
                <td>{j.employer_name}</td>
                <td>
                  <span className={`pill pill-${j.status}`}>{j.status}</span>
                </td>
                <td>{j.application_count}</td>
                <td className="actions">
                  <button type="button" onClick={() => setJobStatus(j.id, "approved")}>
                    Approve
                  </button>
                  <button type="button" onClick={() => setJobStatus(j.id, "rejected")}>
                    Reject
                  </button>
                  <button type="button" onClick={() => setJobStatus(j.id, "closed")}>
                    Close
                  </button>
                  <button type="button" className="danger" onClick={() => remove(j.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
