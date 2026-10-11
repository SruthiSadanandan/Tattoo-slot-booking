import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Services() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.services().then(setServices).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Services</h1>
      {error && <p className="error">{error}</p>}
     <section className="svc-grid" style={{ marginTop: "1.25rem" }}>
  {services.map((s, i) => (
    <article key={s.id} className="svc-card static">
      <span className="svc-num">{String(i + 1).padStart(2, "0")}</span>
      <strong className="svc-name">{s.name}</strong>
      <span className="svc-time">{s.durationMinutes} min</span>
      {s.description && <p className="svc-desc">{s.description}</p>}
      <div className="svc-foot">
        <div className="svc-price">
          <small>From</small>
          <span>₹{s.price}</span>
        </div>
        <span className="muted svc-deposit">₹{s.depositAmount} deposit</span>
      </div>
      <Link className="btn" to="/booking" state={{ serviceId: s.id }}>Book this service</Link>
    </article>
  ))}

  <article className="svc-card svc-custom static">
    <span className="svc-num">+</span>
    <strong className="svc-name">Custom</strong>
    <span className="muted">Something bigger or one of a kind. Price is set after a consultation.</span>
    <Link className="btn" to="/booking" state={{ custom: true }}>Describe your idea</Link>
  </article>
</section>
    </>
  );
}