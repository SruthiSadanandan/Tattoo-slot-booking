import { useCallback, useEffect, useMemo, useState } from "react";
import { api, fileUrl } from "../api";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "BOOKED", label: "Booked" },
];

const STATUS_STYLE = {
  PENDING: { background: "#fdf3d8", color: "#7a5a00" },
  APPROVED: { background: "#dff3e4", color: "#1d6b35" },
  REJECTED: { background: "#fbe2e0", color: "#9a2a22" },
  BOOKED: { background: "#e3e9fb", color: "#2a3f9a" },
};

const money = (v) =>
  v === null || v === undefined
    ? "-"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(Number(v));

const when = (v) => {
  const d = new Date(v);
  return isNaN(d)
    ? "-"
    : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function AdminCustomRequests() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Which card has its review form open: { id, mode: "approve" | "reject" }
  const [open, setOpen] = useState(null);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await api.adminCustomRequests();
      setItems(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e.message || "Could not load custom requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { ALL: items.length };
    items.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
    return c;
  }, [items]);

  const visible = useMemo(
    () => (filter === "ALL" ? items : items.filter((r) => r.status === filter)),
    [items, filter]
  );

  function openForm(id, mode) {
    setOpen({ id, mode });
    setPrice("");
    setNote("");
    setError("");
  }

  async function submit(r) {
    setBusy(true);
    setError("");
    try {
      let updated;
      if (open.mode === "approve") {
        if (!price || Number(price) <= 0) {
          setError("Enter a quoted price greater than 0.");
          setBusy(false);
          return;
        }
        updated = await api.adminApproveCustomRequest(r.id, Number(price), note);
      } else {
        updated = await api.adminRejectCustomRequest(r.id, note);
      }
      setItems((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
      setOpen(null);
    } catch (e) {
      setError(e.message || "Could not save your decision.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Custom requests</h1>
      <p style={s.sub}>Tattoo ideas customers sent in. Approve with a quote or reject with a reason.</p>

      <div style={s.chips}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{ ...s.chip, ...(filter === f.key ? s.chipActive : null) }}
          >
            {f.label} <span style={{ opacity: 0.6 }}>{counts[f.key] || 0}</span>
          </button>
        ))}
      </div>

      {error && (
        <div style={s.error} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p style={s.muted}>Loading requests...</p>
      ) : visible.length === 0 ? (
        <p style={s.muted}>No requests in this view.</p>
      ) : (
        <div style={s.list}>
          {visible.map((r) => (
            <div key={r.id} style={s.card}>
              <div style={s.row}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.customerName || "Customer"}</div>
                  <div style={s.small}>
                    {r.customerEmail} · {when(r.createdAt)}
                  </div>
                </div>
                <span style={{ ...s.badge, ...(STATUS_STYLE[r.status] || {}) }}>{r.status}</span>
              </div>

              <p style={s.desc}>{r.description}</p>

              <div style={s.meta}>
                <span>Placement: {r.placement || "-"}</span>
                <span>Size: {r.size || "-"}</span>
                <span>Budget: {money(r.budget)}</span>
                {r.quotedPrice != null && <span>Quoted: {money(r.quotedPrice)}</span>}
              </div>

              {r.referenceImageUrl && (
                <a href={fileUrl(r.referenceImageUrl)} target="_blank" rel="noreferrer">
                  <img src={fileUrl(r.referenceImageUrl)} alt="Reference" style={s.img} />
                </a>
              )}

              {r.adminNote && <div style={s.note}>Note: {r.adminNote}</div>}

              {r.status === "PENDING" && open?.id !== r.id && (
                <div style={s.actions}>
                  <button style={s.approveBtn} onClick={() => openForm(r.id, "approve")}>
                    Approve
                  </button>
                  <button style={s.rejectBtn} onClick={() => openForm(r.id, "reject")}>
                    Reject
                  </button>
                </div>
              )}

              {open?.id === r.id && (
                <div style={s.form}>
                  {open.mode === "approve" && (
                    <input
                      type="number"
                      min="1"
                      placeholder="Quoted price (INR)"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      style={s.input}
                    />
                  )}
                  <textarea
                    placeholder={open.mode === "approve" ? "Note for the customer (optional)" : "Reason for rejecting"}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    style={{ ...s.input, resize: "vertical" }}
                  />
                  <div style={s.actions}>
                    <button
                      style={open.mode === "approve" ? s.approveBtn : s.rejectBtn}
                      disabled={busy}
                      onClick={() => submit(r)}
                    >
                      {busy ? "Saving..." : open.mode === "approve" ? "Confirm approval" : "Confirm rejection"}
                    </button>
                    <button style={s.ghostBtn} onClick={() => setOpen(null)} disabled={busy}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
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
  chip: { border: "1px solid #d8d5cf", background: "#fff", color: "#161616", padding: "7px 14px", borderRadius: 999, cursor: "pointer", fontSize: 14 },
  chipActive: { background: "#161616", color: "#fff", borderColor: "#161616" },
  error: { background: "#fbe2e0", color: "#9a2a22", padding: "10px 14px", borderRadius: 8, marginBottom: 16 },
  muted: { color: "#6b6b6b" },
  list: { display: "grid", gap: 16, maxWidth: 760 },
  card: { background: "#fff", border: "1px solid #e6e3dd", borderRadius: 10, padding: 18 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  small: { fontSize: 12, color: "#6b6b6b" },
  desc: { margin: "12px 0", lineHeight: 1.5 },
  meta: { display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "#555", marginBottom: 12 },
  img: { maxWidth: 220, maxHeight: 180, borderRadius: 8, border: "1px solid #e6e3dd", marginBottom: 12, display: "block" },
  note: { background: "#f6f4ef", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginBottom: 12 },
  badge: { padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  actions: { display: "flex", gap: 8, marginTop: 8 },
  form: { display: "grid", gap: 8, marginTop: 8 },
  input: { padding: "9px 12px", border: "1px solid #d8d5cf", borderRadius: 6, fontSize: 14, fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  approveBtn: { background: "#161616", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  rejectBtn: { background: "#fff", color: "#9a2a22", border: "1px solid #c9c5bd", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  ghostBtn: { background: "transparent", color: "#555", border: "1px solid #d8d5cf", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 14 },
};
