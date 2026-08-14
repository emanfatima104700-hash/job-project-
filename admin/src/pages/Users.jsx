import { useEffect, useState } from "react";
import api from "../api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");

  const load = () => {
    api
      .get("/admin/users", { params: role ? { role } : {} })
      .then((res) => setUsers(res.data.users))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [role]);

  const toggleActive = async (user) => {
    await api.patch(`/admin/users/${user.id}`, { is_active: !user.is_active });
    setMessage("User updated");
    load();
  };

  const changeRole = async (id, nextRole) => {
    await api.patch(`/admin/users/${id}`, { role: nextRole });
    setMessage("Role updated");
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this user?")) return;
    await api.delete(`/admin/users/${id}`);
    setMessage("User deleted");
    load();
  };

  return (
    <div>
      <div className="toolbar">
        <h2>Users</h2>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="seeker">Seekers</option>
          <option value="employer">Employers</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      {message && <p className="success">{message}</p>}
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                    <option value="seeker">seeker</option>
                    <option value="employer">employer</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <span className={`pill ${u.is_active ? "pill-approved" : "pill-rejected"}`}>
                    {u.is_active ? "active" : "disabled"}
                  </span>
                </td>
                <td className="actions">
                  <button type="button" onClick={() => toggleActive(u)}>
                    {u.is_active ? "Disable" : "Enable"}
                  </button>
                  <button type="button" className="danger" onClick={() => remove(u.id)}>
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
