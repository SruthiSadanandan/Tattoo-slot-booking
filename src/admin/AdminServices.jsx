import { useEffect, useState } from "react";
import { api } from "../api.js";

const EMPTY = { name: "", description: "", durationMinutes: 60, price: 0, depositAmount: 0 };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.services().then(setServices).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const change = (e) => {
    const { name, value, type } = e.target;
    setForm({ ...form, [name]: type === "number" ? Number(value) : value });
  };

  const reset = () => { setForm(EMPTY); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) await api.adminUpdateService(editingId, form);
      else await api.adminCreateService(form);
      reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (s) => {
    setEditingId(s.id);
    setForm({
      name: s.name || "",
      description: s.description || "",
      durationMinutes: s.durationMinutes || 0,
      price: Number(s.price) || 0,
      depositAmount: Number(s.depositAmount) || 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.name}?`)) return;
    try { await api.adminDeleteService(s.id); load(); }
    catch (err) { setError(err.message); }
  };

  return (
    <>
      <div className="admin-head">
        <div><h1>Services</h1><p className="muted">{services.length} services</p></div>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="panel">
        <h2>{editingId ? "Edit service" : "Add service"}</h2>
        <form className="form row" onSubmit={submit}>
          <label>Name<input name="name" value={form.name} onChange={change} required /></label>
          <label>Duration (minutes)<input name="durationMinutes" type="number" min="15" step="15" value={form.durationMinutes} onChange={change} required /></label>
          <label>Price (₹)<input name="price" type="number" min="0" value={form.price} onChange={change} required /></label>
          <label>Deposit (₹)<input name="depositAmount" type="number" min="0" value={form.depositAmount} onChange={change} required /></label>
          <label style={{ flexBasis: "100%" }}>Description<textarea name="description" rows="3" value={form.description} onChange={change} /></label>
          <div className="actions" style={{ flexBasis: "100%", marginTop: 0 }}>
            <button className="btn" type="submit">{editingId ? "Save changes" : "Add service"}</button>
            {editingId && <button className="btn btn-ghost" type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Duration</th><th>Price</th><th>Deposit</th><th></th></tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.durationMinutes} min</td>
                  <td>₹{s.price}</td>
                  <td>₹{s.depositAmount}</td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => edit(s)}>Edit</button>{" "}
                    <button className="btn btn-ghost" onClick={() => remove(s)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}