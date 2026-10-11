import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Awaiting deposit" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "EXPIRED", label: "Hold expired" },
];

const STATUS_LABEL = {
  PENDING: "Awaiting deposit",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  EXPIRED: "Hold expired",
};

const STATUS_STYLE = {
  PENDING: { background: "#fdf3d8", color: "#7a5a00" },
  CONFIRMED: { background: "#dff3e4", color: "#1d6b35" },
  CANCELLED: { background: "#eee", color: "#666" },
  EXPIRED: { background: "#fbe2e0", color: "#9a2a22" },
};

// The backend DTO field names may differ slightly; these helpers read the likely ones.
const pick = (b, ...keys) => {
  for (const k of keys) {
    const v = k.split(".").reduce((o, p) => (o == null ? o : o[p]), b);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
};

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d)) return String(value);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await api.adminBookings();
      setBookings(Array.isArray(res) ? res : []);
    } catch (e) {
      setError("Could not load bookings. Check that the backend is running and you are logged in as admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { ALL: bookings.length };
    bookings.forEach((b) => {
      c[b.status] = (c[b.status] || 0) + 1;
    });
    return c;
  }, [bookings]);

  const visible = useMemo(
    () => (filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );

  async function handleCancel(b) {
    const who = pick(b, "customerName", "userName", "user.name") || "this customer";
    if (!window.confirm(`Cancel the booking for ${who}? The time slot will open up again.`)) return;
    setBusyId(b.id);
    setError("");
    try {
      await api.adminCancelBooking(b.id);
      setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: "CANCELLED" } : x)));
    } catch (e) {
      setError("Could not cancel that booking. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Bookings</h1>
      <p style={s.sub}>Every appointment across all artists, newest first.</p>

      <div style={s.chips} role="tablist" aria-label="Filter bookings by status">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.key)}
              style={{ ...s.chip, ...(active ? s.chipActive : null) }}
            >
              {f.label} <span style={{ opacity: 0.6 }}>{counts[f.key] || 0}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div style={s.error} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p style={s.muted}>Loading bookings...</p>
      ) : visible.length === 0 ? (
        <p style={s.muted}>
          {filter === "ALL" ? "No bookings yet." : "No bookings with this status."}
        </p>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["When", "Customer", "Artist", "Service", "Design", "Deposit", "Status", ""].map((h) => (
                  <th key={h} style={s.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => {
                const canCancel = b.status === "PENDING" || b.status === "CONFIRMED";
                return (
                  <tr key={b.id}>
                    <td style={s.td}>{formatDateTime(pick(b, "startTime", "start"))}</td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600 }}>
                        {pick(b, "customerName", "userName", "user.name") || "-"}
                      </div>
                      <div style={s.small}>{pick(b, "customerEmail", "userEmail", "user.email") || ""}</div>
                    </td>
                    <td style={s.td}>{pick(b, "artistName", "artist.name") || "-"}</td>
                    <td style={s.td}>{pick(b, "serviceName", "service.name") || "-"}</td>
                    <td style={s.td}>{pick(b, "designTitle", "designName", "design.title", "design.name") || "Custom / none"}</td>
                    <td style={s.td}>{formatMoney(b.depositAmount)}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, ...(STATUS_STYLE[b.status] || STATUS_STYLE.CANCELLED) }}>
                        {STATUS_LABEL[b.status] || b.status}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: "right" }}>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(b)}
                          disabled={busyId === b.id}
                          style={s.cancelBtn}
                        >
                          {busyId === b.id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { padding: "32px 40px", color: "#161616", fontFamily: "inherit" },
  h1: { margin: 0, fontSize: 28, fontWeight: 700 },
  sub: { margin: "6px 0 24px", color: "#6b6b6b" },
  chips: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: {
    border: "1px solid #d8d5cf",
    background: "#fff",
    color: "#161616",
    padding: "7px 14px",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 14,
  },
  chipActive: { background: "#161616", color: "#fff", borderColor: "#161616" },
  error: {
    background: "#fbe2e0",
    color: "#9a2a22",
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 16,
  },
  muted: { color: "#6b6b6b" },
  tableWrap: { overflowX: "auto", background: "#fff", border: "1px solid #e6e3dd", borderRadius: 10 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    fontWeight: 600,
    color: "#6b6b6b",
    borderBottom: "1px solid #e6e3dd",
    whiteSpace: "nowrap",
  },
  td: { padding: "12px 14px", borderBottom: "1px solid #f0eee9", verticalAlign: "top" },
  small: { fontSize: 12, color: "#6b6b6b" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  cancelBtn: {
    border: "1px solid #c9c5bd",
    background: "#fff",
    color: "#9a2a22",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
};
