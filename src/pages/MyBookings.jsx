import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const fmt = (iso) =>
  new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

export default function MyBookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api.myBookings().then(setBookings).catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await api.cancelBooking(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <h1>My bookings</h1>
      {error && <p className="error">{error}</p>}
      {bookings === null && !error && <p className="muted">Loading your bookings...</p>}
      {bookings?.length === 0 && (
        <p className="muted">No bookings yet. <Link to="/designs">Find a design</Link> to get started.</p>
      )}
      <section className="list">
        {bookings?.map((b) => (
          <article key={b.id} className="panel booking-row">
            <div>
              <strong>{b.design?.name || b.designName || "Custom design"}</strong>
              <p className="muted">
                {b.service?.name || b.serviceName} with {b.artist?.name || b.artistName}
              </p>
              <p>{fmt(b.startTime)}</p>
            </div>
            <div className="booking-side">
              <span className={`status ${String(b.status).toLowerCase()}`}>{b.status}</span>
              {["PENDING", "CONFIRMED"].includes(String(b.status).toUpperCase()) && (
                <button className="btn ghost" onClick={() => cancel(b.id)}>Cancel booking</button>
              )}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
