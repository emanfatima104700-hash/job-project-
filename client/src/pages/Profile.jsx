import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    company_name: "",
    title: "",
    bio: "",
    location: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        company_name: user.company_name || "",
        title: user.title || "",
        bio: user.bio || "",
        location: user.location || "",
      });
    }
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.put("/auth/me", form);
      await refreshUser();
      setMessage("Profile updated");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="page">
      <section className="page-hero page-hero-profile">
        <div className="container">
          <h1>Your profile</h1>
          <p>Keep your details current for better matches.</p>
        </div>
      </section>
      <div className="container narrow">
        <form className="panel form-grid" onSubmit={submit}>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label>
            Location
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          {user?.role === "employer" && (
            <label className="full">
              Company
              <input
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </label>
          )}
          <label className="full">
            Bio
            <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </label>
          {error && <p className="form-error full">{error}</p>}
          {message && <p className="form-success full">{message}</p>}
          <button className="btn btn-primary full">Save changes</button>
        </form>
      </div>
    </div>
  );
}
