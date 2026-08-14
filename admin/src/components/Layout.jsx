import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="logo">
          Hire<span>Orbit</span>
          <small>Admin</small>
        </div>
        <nav>
          <NavLink to="/" end>
            Overview
          </NavLink>
          <NavLink to="/users">Users</NavLink>
          <NavLink to="/jobs">Jobs</NavLink>
          <NavLink to="/applications">Applications</NavLink>
        </nav>
        <button
          type="button"
          className="logout"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </aside>
      <div className="admin-main">
        <header className="topbar">
          <div>
            <h1>Control Center</h1>
            <p>Signed in as {user?.name}</p>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
