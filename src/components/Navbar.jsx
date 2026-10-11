import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  { to: "/home", label: "Home" },
  { to: "/designs", label: "Designs" },
  { to: "/artists", label: "Artists" },
  { to: "/services", label: "Services" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const loggedIn = !!user;

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="nav">
      <Link to={loggedIn ? "/home" : "/login"} className="brand">Inkwell</Link>

      <nav className="nav-links">
        {loggedIn ? (
          <>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
            ))}
            <NavLink to="/my-bookings">My bookings</NavLink>
            <NavLink to="/cart">Cart</NavLink>
            <NavLink to="/profile">{user?.name || "Profile"}</NavLink>
            <button className="btn btn-ghost" onClick={onLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link className="btn btn-ghost" to="/login">Log in</Link>
            <Link className="btn" to="/signup">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
