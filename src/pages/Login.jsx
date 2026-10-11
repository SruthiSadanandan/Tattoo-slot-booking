import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(form.email.trim(), form.password);
      const from = location.state?.from;
      const isAdmin = u?.role === "ADMIN";
      navigate(isAdmin && (!from || from === "/home") ? "/admin" : from || "/home", {
        replace: true,
      });
    } catch (err) {
      setError(err.status === 401 ? "Incorrect email or password." : err.message);
    } finally {
      setLoading(false);
    }
  };

  // Already logged in: no need to see the login page
  if (user) return <Navigate to={user.role === "ADMIN" ? "/admin" : "/home"} replace />;

  return (
    <div className="auth-card">
      <h1>Welcome back</h1>
      <p className="muted">Log in to book your next piece.</p>
      <form onSubmit={onSubmit} className="form">
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
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="muted center">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </div>
  );
}
