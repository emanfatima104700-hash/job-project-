import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          Hire<span>Orbit</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/jobs">Browse Jobs</NavLink>
          {user?.role === "employer" && <NavLink to="/post-job">Post a Job</NavLink>}
          {user && <NavLink to="/dashboard">Dashboard</NavLink>}
          {!user ? (
            <>
              <NavLink to="/login">Sign In</NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          ) : (
            <>
              <NavLink to="/profile">{user.name.split(" ")[0]}</NavLink>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
