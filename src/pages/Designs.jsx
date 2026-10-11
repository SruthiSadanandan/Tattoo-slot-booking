import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, fileUrl } from "../api.js";

const STYLES = ["All", "Fine line", "Traditional", "Blackwork", "Realism", "Minimal"];

export default function Designs() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const style = params.get("style") || "All";
  const [designs, setDesigns] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.designs(style).then(setDesigns).catch((e) => setError(e.message));
  }, [style]);

  return (
    <>
      <h1>Designs</h1>
      <div className="chips">
        {STYLES.map((s) => (
          <button key={s} className={`chip ${style === s ? "active" : ""}`}
            onClick={() => setParams(s === "All" ? {} : { style: s })}>
            {s}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <section className="grid">
        <Link className="card custom-card" to="/booking" state={{ custom: true }}>
          <span className="plus">+</span>
          <strong>Custom design</strong>
          <span className="muted">Describe your idea. Final price is set after a consultation.</span>
        </Link>
        {designs.map((d) => (
          <button key={d.id} className="card" onClick={() => navigate("/booking", { state: { design: d } })}>
            <img src={fileUrl(d.imageUrl)} alt={d.title} loading="lazy" />
            <div className="card-body">
              <strong>{d.title}</strong>
              <span className="muted">{d.style}</span>
              {d.artist?.name && <span className="muted">by {d.artist.name}</span>}
            </div>
          </button>
        ))}
      </section>
      {designs.length === 0 && !error && <p className="muted">No designs in this style yet.</p>}
    </>
  );
}