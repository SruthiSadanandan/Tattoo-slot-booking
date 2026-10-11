import { createContext, useContext, useState } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

// Read the payload of a JWT (no verification, only for showing the right UI)
function decodeJwt(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part));
  } catch {
    return {};
  }
}

// Find the role wherever the backend puts it, and turn "ROLE_ADMIN" into "ADMIN"
function pickRole(data, payload) {
  let r =
    data.role ??
    data.user?.role ??
    data.roles ??
    payload.role ??
    payload.roles ??
    payload.authorities;
  if (Array.isArray(r)) r = r[0];
  if (r && typeof r === "object") r = r.authority ?? r.name;
  return r ? String(r).replace(/^ROLE_/, "").toUpperCase() : "CUSTOMER";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const login = async (email, password) => {
    const data = await api.login(email, password);

    // Save JWT
    localStorage.setItem("token", data.token);

    // Save user information, including the role
    const payload = decodeJwt(data.token);
    const userData = {
      email,
      name: data.name ?? data.user?.name ?? payload.name ?? "",
      role: pickRole(data, payload),
    };

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const signup = async (name, email, password) => {
    await api.register(name, email, password);

    // After successful registration, login automatically
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);