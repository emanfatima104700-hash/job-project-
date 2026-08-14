import { useEffect, useState } from "react";
import api from "../api";

export default function Applications() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    api.get("/admin/applications").then((res) => setApplications(res.data.applications)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="toolbar">
        <h2>All applications</h2>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Seeker</th>
              <th>Email</th>
              <th>Job</th>
              <th>Company</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id}>
                <td>{a.seeker_name}</td>
                <td>{a.seeker_email}</td>
                <td>{a.job_title}</td>
                <td>{a.company}</td>
                <td>
                  <span className={`pill pill-${a.status}`}>{a.status}</span>
                </td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!applications.length && <p className="muted pad">No applications yet.</p>}
      </div>
    </div>
  );
}
