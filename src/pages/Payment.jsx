import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import PayMethods from "../components/Paymethods.jsx";

// true  = UI only, no real payment; the booking is marked confirmed by a demo endpoint
// false = real Razorpay popup (needs the /api/payments backend)
const DEMO_MODE = true;

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function useCountdown(expiresAt) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(expiresAt) - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, new Date(expiresAt) - Date.now())), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}

const METHOD_LABEL = {
  gpay: "Google Pay",
  upi: "UPI",
  card: "card",
  netbanking: "net banking",
};

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clear } = useCart();
  const [status, setStatus] = useState("idle"); // idle | paying | paid
  const [error, setError] = useState("");
  const [pm, setPm] = useState({ method: "gpay", valid: true });

  const booking = state?.booking;
  const summary = state?.summary;
  const left = useCountdown(booking?.holdExpiresAt);

  if (!booking || !summary) return <Navigate to="/cart" replace />;

  const expired = left === 0 && status !== "paid";
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");

  const title = summary.design
    ? summary.design.title || summary.design.name || "Selected design"
    : "Custom design";

  const pay = async () => {
    setError("");

    if (DEMO_MODE) {
      if (!pm.valid) {
        setError("Please complete the payment details above.");
        return;
      }
      setStatus("paying");
      try {
        await new Promise((r) => setTimeout(r, 1200));
        await api.demoConfirm(booking.id); // marks the booking CONFIRMED in the database
        clear();
        setStatus("paid");
      } catch (err) {
        setError(err.message);
        setStatus("idle");
      }
      return;
    }

    setStatus("paying");
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load Razorpay. Check your connection and try again.");

      const order = await api.createOrder(booking.id);

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Inkwell Tattoo Studio",
        description: `Deposit for ${title}`,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#d6452f" },
        config: {
          display: {
            blocks: {
              upi: { name: "Pay with UPI / Google Pay", instruments: [{ method: "upi" }] },
              card: { name: "Credit / Debit card", instruments: [{ method: "card" }] },
            },
            sequence: ["block.upi", "block.card"],
            preferences: { show_default_blocks: true },
          },
        },
        handler: async (resp) => {
          try {
            await api.verifyPayment({
              bookingId: booking.id,
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            clear();
            setStatus("paid");
          } catch (err) {
            setError(`Payment went through but verification failed: ${err.message}. Please contact the studio.`);
            setStatus("idle");
          }
        },
        modal: { ondismiss: () => setStatus((s) => (s === "paying" ? "idle" : s)) },
      });
      rzp.on("payment.failed", (r) => {
        setError(r.error?.description || "Payment failed. You can try again.");
        setStatus("idle");
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const cancel = async () => {
    try {
      await api.cancelBooking(booking.id);
    } catch {
      /* the expiry job will release the hold anyway */
    }
    navigate("/cart");
  };

  if (status === "paid") {
    return (
      <div className="empty">
        <h1>Booking confirmed 🎉</h1>
        <p>
          {title} with <strong>{summary.artist.name}</strong> on{" "}
          {new Date(summary.startTime).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}.
        </p>
        <p className="muted">
          {summary.custom ? "We will contact you to arrange the consultation." : "See you at the studio."}
        </p>
        <Link to="/" className="btn">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1>Pay your deposit</h1>
      <div className="panel summary">
        <div className="line">
          <span>Design</span>
          <span>{title}</span>
        </div>
        <div className="line">
          <span>Service</span>
          <span>{summary.service.name}</span>
        </div>
        <div className="line">
          <span>Artist</span>
          <span>{summary.artist.name}</span>
        </div>
        <div className="line">
          <span>Time</span>
          <span>{new Date(summary.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
        </div>
        <div className="line total">
          <span>Deposit</span>
          <span>₹{booking.depositAmount}</span>
        </div>

        {expired ? (
          <>
            <p className="error">Your hold expired and the slot was released. Please pick a time again.</p>
            <Link to="/" className="btn">
              Choose a new slot
            </Link>
          </>
        ) : (
          <>
            <p className="timer">
              Your slot is held for <strong>{mm}:{ss}</strong>
            </p>

            {DEMO_MODE && <PayMethods onChange={setPm} />}

            {error && <p className="error">{error}</p>}

            <button className="btn" onClick={pay} disabled={status === "paying"}>
              {status === "paying"
                ? "Processing payment..."
                : DEMO_MODE
                ? `Pay ₹${booking.depositAmount} with ${METHOD_LABEL[pm.method]}`
                : `Pay ₹${booking.depositAmount} with Razorpay`}
            </button>
            <button className="btn btn-ghost" onClick={cancel} disabled={status === "paying"}>
              Cancel and release slot
            </button>
          </>
        )}
      </div>
    </>
  );
}