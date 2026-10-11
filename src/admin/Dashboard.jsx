
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const STATUS_CLASS = {
  CONFIRMED: "confirmed",
  PENDING: "pending",
  QUOTE_PENDING: "quote",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
};

const STATUS_LABEL = {
  CONFIRMED: "Confirmed",
  PENDING: "Awaiting deposit",
  QUOTE_PENDING: "Quote pending",
  EXPIRED: "Hold expired",
  CANCELLED: "Cancelled",
};

const time = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = () =>
  new Date().toLocaleDateString([], { dateStyle: "full" });

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await api.adminDashboard();

        if (active) {
          setData(result);
        }
      } catch (err) {
        if (active) {
          setError(
            `${err.status ? `HTTP ${err.status}: ` : ""}${err.message}`
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="muted">Loading admin dashboard...</p>;
  }

  if (error) {
    return (
      <section className="panel">
        <h1>Dashboard could not load</h1>
        <p className="error">{error}</p>

        <p className="muted">
          Check your login token, admin role and Spring Boot dashboard
          endpoint.
        </p>

        <button
          type="button"
          className="btn"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </section>
    );
  }

  if (!data || typeof data !== "object") {
    return <p className="error">The server returned an invalid dashboard response.</p>;
  }

  const bookingsToday = data.bookingsToday ?? 0;
  const awaitingDeposit = data.awaitingDeposit ?? 0;
  const depositsThisMonth = data.depositsThisMonth ?? 0;
  const holdsExpiring = data.holdsExpiring ?? 0;
  const customToReview = data.customToReview ?? 0;

  const schedule = Array.isArray(data.schedule) ? data.schedule : [];
  const requests = Array.isArray(data.requests) ? data.requests : [];
  const artists = Array.isArray(data.artists) ? data.artists : [];

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Overview</h1>
          <p className="muted">{formatDate()}</p>
        </div>

        <Link className="btn" to="/admin/bookings">
          All bookings
        </Link>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="muted">Bookings today</span>
          <strong>{bookingsToday}</strong>
          <small className="muted">
            {awaitingDeposit} still need a deposit
          </small>
        </div>

        <div className="stat">
          <span className="muted">Deposits this month</span>
          <strong>₹{depositsThisMonth}</strong>
        </div>

        <div className="stat">
          <span className="muted">Holds expiring soon</span>
          <strong>{holdsExpiring}</strong>
        </div>

        <div className="stat">
          <span className="muted">Custom requests to review</span>
          <strong>{customToReview}</strong>
        </div>
      </div>

      <div className="admin-cols">
        <section className="panel wide">
          <h2>Today's schedule</h2>

          {schedule.length === 0 ? (
            <p className="muted">No bookings today.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Artist</th>
                    <th>Service</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {schedule.map((booking) => (
                    <tr key={booking.id}>
                      <td>{time(booking.startTime)}</td>
                      <td>{booking.customerName || "—"}</td>
                      <td>{booking.artistName || "—"}</td>
                      <td>{booking.serviceName || "—"}</td>
                      <td>
                        <span
                          className={`status ${
                            STATUS_CLASS[booking.status] || ""
                          }`}
                        >
                          {STATUS_LABEL[booking.status] ||
                            booking.status ||
                            "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Custom design requests</h2>

          {requests.length === 0 ? (
            <p className="muted">Nothing waiting for a quote.</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="row-item">
                <strong>{request.title || "Custom request"}</strong>
                <span className="muted">
                  {request.placement || "Placement not specified"}
                  {request.hasReference ? " · reference attached" : ""}
                </span>
              </div>
            ))
          )}
        </section>

        <section className="panel">
          <h2>Artist availability</h2>

          {artists.length === 0 ? (
            <p className="muted">No artist availability data.</p>
          ) : (
            artists.map((artist) => (
              <div key={artist.id} className="row-item split">
                <span>{artist.name}</span>
                <span className="muted">
                  {artist.booked ?? 0} of {artist.total ?? 0} slots booked
                </span>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}