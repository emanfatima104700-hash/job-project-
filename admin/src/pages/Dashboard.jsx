import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then((res) => setData(res.data)).catch(() => {});
  }, []);

  if (!data) return <p className="muted">Loading overview...</p>;

  const cards = [
    { label: "Users", value: data.stats.users },
    { label: "Seekers", value: data.stats.seekers },
    { label: "Employers", value: data.stats.employers },
    { label: "Jobs", value: data.stats.jobs },
    { label: "Pending Jobs", value: data.stats.pendingJobs },
    { label: "Applications", value: data.stats.applications },
  ];

  return (
    <div>
      <div className="cards">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <span>{c.label}</span>
            <strong>{c.value}</strong>
          </div>
        ))}
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <h3>Recent jobs</h3>
            <Link to="/jobs">Manage</Link>
          </div>
          <ul className="list">
            {data.recentJobs.map((j) => (
              <li key={j.id}>
                <div>
                  <strong>{j.title}</strong>
                  <p>{j.company}</p>
                </div>
                <span className={`pill pill-${j.status}`}>{j.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Recent applications</h3>
            <Link to="/applications">View all</Link>
          </div>
          <ul className="list">
            {data.recentApps.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{a.seeker_name}</strong>
                  <p>{a.job_title}</p>
                </div>
                <span className={`pill pill-${a.status}`}>{a.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
