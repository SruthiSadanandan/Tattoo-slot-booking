// Save as src/components/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Only logged-in users with role ADMIN can open the admin pages.
export default function AdminRoute({ children }) {
   const { user } = useAuth();
   if (!user) return <Navigate to="/login" replace />;
   if (user.role !== "ADMIN") return <Navigate to="/" replace />;
   return children;
}
