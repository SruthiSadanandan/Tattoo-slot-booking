import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/custom-requests", label: "Custom requests" },
  { to: "/admin/artists", label: "Artists" },
  { to: "/admin/services", label: "Services" },
  { to: "/admin/designs", label: "Design gallery" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand">Inkwell</div>
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
        ))}
        <div className="admin-foot">
          <span>{user?.name || user?.email || "Admin"}</span>
          <NavLink to="/">View site</NavLink>
          <button onClick={onLogout}>Log out</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}