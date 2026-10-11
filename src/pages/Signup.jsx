import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await signup(form.name.trim(), form.email.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.status === 409 ? "An account with this email already exists." : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Create your account</h1>
      <p className="muted">Browse designs, pick an artist and book a slot.</p>
      <form onSubmit={onSubmit} className="form">
        <label>
          Full name
          <input name="name" value={form.name} onChange={onChange} required autoComplete="name" />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={onChange} required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={onChange}
            required
            autoComplete="new-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="muted center">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
