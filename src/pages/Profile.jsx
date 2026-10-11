import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <h1>Profile</h1>
      <section className="panel">
        <dl className="details">
          <dt>Name</dt><dd>{user?.name}</dd>
          <dt>Email</dt><dd>{user?.email}</dd>
          {user?.phone && (<><dt>Phone</dt><dd>{user.phone}</dd></>)}
        </dl>
        <button className="btn ghost" onClick={onLogout}>Log out</button>
      </section>
    </>
  );
}
