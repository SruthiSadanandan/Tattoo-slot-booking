import { useEffect, useState } from "react";
import { api, fileUrl } from "../api.js";

const STYLES = ["Fine line", "Traditional", "Blackwork", "Realism", "Minimal"];
const EMPTY = { title: "", style: STYLES[0], imageUrl: "", artist: null };

export default function AdminDesigns() {
  const [designs, setDesigns] = useState([]);
  const [artists, setArtists] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.designs().then(setDesigns).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    api.artists().then(setArtists).catch(() => {});
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { url } = await api.uploadDesignImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setForm(EMPTY); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.imageUrl) return setError("Upload an image first.");
    try {
      if (editingId) await api.adminUpdateDesign(editingId, form);
      else await api.adminCreateDesign(form);
      reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (d) => {
    setEditingId(d.id);
    setForm({
      title: d.title || "",
      style: d.style || STYLES[0],
      imageUrl: d.imageUrl || "",
      artist: d.artist ? { id: d.artist.id } : null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete "${d.title}"?`)) return;
    try { await api.adminDeleteDesign(d.id); load(); }
    catch (err) { setError(err.message); }
  };

  return (
    <>
      <div className="admin-head">
        <div><h1>Design gallery</h1><p className="muted">{designs.length} designs</p></div>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="panel">
        <h2>{editingId ? "Edit design" : "Add design"}</h2>
        <form className="form row" onSubmit={submit}>
          <label>Title<input name="title" value={form.title} onChange={change} required /></label>
          <label>Style
            <select name="style" value={form.style} onChange={change}>
              {STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>Artist
            <select
              value={form.artist?.id || ""}
              onChange={(e) =>
                setForm({ ...form, artist: e.target.value ? { id: Number(e.target.value) } : null })
              }
            >
              <option value="">No artist</option>
              {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label>Image<input type="file" accept="image/*" onChange={pickFile} /></label>
          {uploading && <p className="muted" style={{ flexBasis: "100%" }}>Uploading...</p>}
          {form.imageUrl && <img className="preview" src={fileUrl(form.imageUrl)} alt="Preview" />}
          <div className="actions" style={{ flexBasis: "100%", marginTop: 0 }}>
            <button className="btn" type="submit" disabled={uploading}>
              {editingId ? "Save changes" : "Add design"}
            </button>
            {editingId && <button className="btn btn-ghost" type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="grid" style={{ marginTop: "1.5rem" }}>
        {designs.map((d) => (
          <article key={d.id} className="card static">
            <img src={fileUrl(d.imageUrl)} alt={d.title} loading="lazy" />
            <div className="card-body">
              <strong>{d.title}</strong>
              <span className="muted">{d.style}</span>
              {d.artist?.name && <span className="muted">by {d.artist.name}</span>}
              <div className="actions" style={{ marginTop: ".5rem" }}>
                <button className="btn btn-ghost" onClick={() => edit(d)}>Edit</button>
                <button className="btn btn-ghost" onClick={() => remove(d)}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}