import { useEffect, useState } from "react";

const METHODS = [
  { id: "gpay", label: "Google Pay", hint: "Approve in your GPay app" },
  { id: "upi", label: "Other UPI", hint: "PhonePe, Paytm, BHIM or any UPI ID" },
  { id: "card", label: "Credit / Debit card", hint: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net banking", hint: "Pay from your bank account" },
];

const BANKS = ["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Bank", "Canara Bank"];

const formatCard = (v) =>
  v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

const formatExpiry = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function PayMethods({ onChange }) {
  const [method, setMethod] = useState("gpay");
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });

  const setC = (e) => {
    const { name, value } = e.target;
    const next =
      name === "number" ? formatCard(value) :
      name === "expiry" ? formatExpiry(value) :
      name === "cvv" ? value.replace(/\D/g, "").slice(0, 4) : value;
    setCard({ ...card, [name]: next });
  };

  let valid = false;
  if (method === "gpay") valid = true;
  if (method === "upi") valid = /^[\w.\-]{2,}@[\w]{2,}$/.test(upiId.trim());
  if (method === "netbanking") valid = Boolean(bank);
  if (method === "card") {
    valid =
      card.number.replace(/\s/g, "").length === 16 &&
      card.name.trim().length > 1 &&
      /^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry) &&
      card.cvv.length >= 3;
  }

  useEffect(() => {
    onChange?.({ method, valid });
  }, [method, valid]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pay-methods">
      <h3>Choose a payment method</h3>

      <div className="pay-options">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`pay-option ${method === m.id ? "active" : ""}`}
            onClick={() => setMethod(m.id)}
          >
            <span className="pay-radio" />
            <span className="pay-text">
              <strong>{m.label}</strong>
              <small>{m.hint}</small>
            </span>
          </button>
        ))}
      </div>

      {method === "gpay" && (
        <p className="muted pay-field">
          You will be asked to approve the payment in the Google Pay app on your phone.
        </p>
      )}

      {method === "upi" && (
        <label className="pay-field">
          UPI ID
          <input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="name@bank"
            autoComplete="off"
          />
        </label>
      )}

      {method === "netbanking" && (
        <label className="pay-field">
          Select your bank
          <select value={bank} onChange={(e) => setBank(e.target.value)}>
            <option value="">Choose a bank</option>
            {BANKS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>
      )}

      {method === "card" && (
        <div className="form row pay-field">
          <label style={{ flexBasis: "100%" }}>
            Card number
            <input
              name="number"
              value={card.number}
              onChange={setC}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              autoComplete="off"
            />
          </label>
          <label style={{ flexBasis: "100%" }}>
            Name on card
            <input name="name" value={card.name} onChange={setC} autoComplete="off" />
          </label>
          <label>
            Expiry
            <input name="expiry" value={card.expiry} onChange={setC} placeholder="MM/YY" inputMode="numeric" />
          </label>
          <label>
            CVV
            <input name="cvv" type="password" value={card.cvv} onChange={setC} inputMode="numeric" autoComplete="off" />
          </label>
        </div>
      )}
    </div>
  );
}