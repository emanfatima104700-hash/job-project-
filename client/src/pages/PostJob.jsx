import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const empty = {
  title: "",
  company: "",
  location: "",
  type: "Full-time",
  category: "Engineering",
  salary_min: "",
  salary_max: "",
  description: "",
  requirements: "",
  benefits: "",
  skills: "",
};

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...empty, company: user?.company_name || "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const generate = async () => {
    if (!form.title || !form.company) {
      setError("Add title and company first");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/jobs/generate-description", {
        title: form.title,
        company: form.company,
        type: form.type,
        location: form.location || "Remote",
        skills: form.skills,
      });
      setForm((f) => ({
        ...f,
        description: data.description,
        requirements: data.requirements,
        benefits: data.benefits,
      }));
    } catch (err) {
      setError(err.response?.data?.message || "AI generation failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/jobs", {
        ...form,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post job");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <section className="page-hero page-hero-post">
        <div className="container">
          <h1>Post a new role</h1>
          <p>Write manually or generate a polished description with AI.</p>
        </div>
      </section>

      <div className="container narrow">
        <form className="panel form-grid" onSubmit={submit}>
          <label>
            Job title
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label>
            Company
            <input required value={form.company} onChange={(e) => set("company", e.target.value)} />
          </label>
          <label>
            Location
            <input required value={form.location} onChange={(e) => set("location", e.target.value)} />
          </label>
          <label>
            Type
            <select value={form.type} onChange={(e) => set("type", e.target.value)}>
              {["Full-time", "Part-time", "Contract", "Internship", "Remote"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <input value={form.category} onChange={(e) => set("category", e.target.value)} />
          </label>
          <label>
            Skills (comma separated)
            <input value={form.skills} onChange={(e) => set("skills", e.target.value)} />
          </label>
          <label>
            Salary min
            <input type="number" value={form.salary_min} onChange={(e) => set("salary_min", e.target.value)} />
          </label>
          <label>
            Salary max
            <input type="number" value={form.salary_max} onChange={(e) => set("salary_max", e.target.value)} />
          </label>
          <div className="full row-between">
            <h3>Description</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={generate} disabled={busy}>
              Generate with AI
            </button>
          </div>
          <label className="full">
            Description
            <textarea required rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          <label className="full">
            Requirements
            <textarea rows={4} value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
          </label>
          <label className="full">
            Benefits
            <textarea rows={3} value={form.benefits} onChange={(e) => set("benefits", e.target.value)} />
          </label>
          {error && <p className="form-error full">{error}</p>}
          <button className="btn btn-primary full" disabled={busy}>
            {busy ? "Saving..." : "Submit for approval"}
          </button>
        </form>
      </div>
    </div>
  );
}
