import { useEffect, useState } from "react";
import { api } from "../api.js";

const EMPTY = { name: "", bio: "", experience: 0, specialization: "", location: "" };

export default function AdminArtists() {
  const [artists, setArtists] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.artists().then(setArtists).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const change = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "experience" ? Number(value) : value });
  };

  const reset = () => { setForm(EMPTY); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) await api.adminUpdateArtist(editingId, form);
      else await api.adminCreateArtist(form);
      reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (a) => {
    setEditingId(a.id);
    setForm({
      name: a.name || "",
      bio: a.bio || "",
      experience: a.experience || 0,
      specialization: a.specialization || "",
      location: a.location || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete ${a.name}?`)) return;
    try {
      await api.adminDeleteArtist(a.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Artists</h1>
          <p className="muted">{artists.length} on the team</p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="panel">
        <h2>{editingId ? "Edit artist" : "Add artist"}</h2>
        <form className="form row" onSubmit={submit}>
          <label>Name<input name="name" value={form.name} onChange={change} required /></label>
          <label>Specialization<input name="specialization" value={form.specialization} onChange={change} /></label>
          <label>Experience (years)<input name="experience" type="number" min="0" value={form.experience} onChange={change} /></label>
          <label>Location<input name="location" value={form.location} onChange={change} /></label>
          <label style={{ flexBasis: "100%" }}>Bio<textarea name="bio" rows="3" value={form.bio} onChange={change} /></label>
          <div className="actions" style={{ flexBasis: "100%", marginTop: 0 }}>
            <button className="btn" type="submit">{editingId ? "Save changes" : "Add artist"}</button>
            {editingId && <button className="btn btn-ghost" type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </section>

      <div className="team-grid" style={{ marginTop: "1.5rem" }}>
        {artists.map((a) => (
          <article key={a.id} className={`team-card${a.id === editingId ? " editing" : ""}`}>
            <div className="team-top">
              <div className="monogram">{a.name?.charAt(0).toUpperCase()}</div>
              <div className="team-name">
                <strong>{a.name}</strong>
                {a.specialization && <span className="team-tag">{a.specialization}</span>}
              </div>
            </div>

            <div className="team-meta">
              <span>{a.experience || 0} yrs</span>
              {a.location && <span>{a.location}</span>}
            </div>

            {a.bio && <p className="team-bio">{a.bio}</p>}

            <div className="team-foot team-actions">
              <button className="btn btn-ghost" onClick={() => edit(a)}>Edit</button>
              <button className="btn btn-ghost danger" onClick={() => remove(a)}>Delete</button>
            </div>
          </article>
        ))}
      </div>

      {artists.length === 0 && <p className="muted" style={{ marginTop: "1rem" }}>No artists yet. Add the first one above.</p>}
    </>
  );
}