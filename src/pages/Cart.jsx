import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, fileUrl } from "../api.js";
import { useCart } from "../context/CartContext.jsx";

const designTitle = (d) => d?.title || d?.name || "Selected design";

export default function Cart() {
  const { item, clear } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!item) {
    return (
      <div className="empty">
        <h1>Your cart is empty</h1>
        <p className="muted">Pick a design and a time to get started.</p>
        <Link to="/" className="btn">
          Browse designs
        </Link>
      </div>
    );
  }

  const { design, custom, service, artist, startTime } = item;

  // Deposit comes straight from the service
  const deposit = Number(service.depositAmount) || 0;
  const price = Number(service.price) || 0;
  const percent = price > 0 ? Math.round((deposit / price) * 100) : null;

  const when = new Date(startTime).toLocaleString([], { dateStyle: "full", timeStyle: "short" });

  // Creating the booking places a 15-minute hold on the slot
  const checkout = async () => {
    setError("");
    setLoading(true);
    try {
      const payload = {
        artistId: artist.id,
        serviceId: service.id,
        startTime,
        ...(design ? { designId: design.id } : { custom }),
      };
      const booking = await api.createBooking(payload);
      navigate("/payment", { state: { booking, summary: { design, custom, service, artist, startTime } } });
    } catch (err) {
      setError(
        err.status === 409
          ? "That time was just taken. Please choose another slot."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Your cart</h1>
      <div className="cart-item">
        {design ? (
          <div className="cart-thumb">
            <span className="cart-initial">{designTitle(design).charAt(0).toUpperCase()}</span>
            {design.image && (
              <img
                src={fileUrl(design.image)}
                alt={designTitle(design)}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>
        ) : (
          <div className="cart-placeholder">Custom</div>
        )}

        <div className="cart-info">
          <h2>{design ? designTitle(design) : "Custom design"}</h2>
          {design?.style && <p className="muted">{design.style}</p>}
          {custom && (
            <>
              <p>{custom.description}</p>
              <p className="muted">Placement: {custom.placement}</p>
              {custom.referenceImageUrl && (
                <img
                  className="preview small"
                  src={fileUrl(custom.referenceImageUrl)}
                  alt="Reference"
                />
              )}
            </>
          )}
          <p>
            {service.name} · {service.durationMinutes} min with <strong>{artist.name}</strong>
          </p>
          <p className="muted">{when}</p>
        </div>
        <button className="btn btn-ghost" onClick={clear}>
          Remove
        </button>
      </div>

      <div className="panel summary">
        <div className="line">
          <span>Service price</span>
          <span>₹{service.price}</span>
        </div>
        <div className="line total">
          <span>Deposit due now{percent !== null ? ` (${percent}%)` : ""}</span>
          <span>₹{deposit}</span>
        </div>
        <p className="muted">
          {custom
            ? "The final price for a custom design is set after your consultation. Only the deposit is charged now."
            : "The remaining balance is paid at the studio."}
        </p>
        {error && <p className="error">{error}</p>}
        <button className="btn" onClick={checkout} disabled={loading}>
          {loading ? "Holding your slot..." : "Proceed to payment"}
        </button>
      </div>
    </>
  );
}