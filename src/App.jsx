import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";
import Designs from "./pages/Designs.jsx";
import Artists from "./pages/Artists.jsx";
import Services from "./pages/Services.jsx";
import Booking from "./pages/Booking.jsx";

import Cart from "./pages/Cart.jsx";
import Payment from "./pages/Payment.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Profile from "./pages/Profile.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import Dashboard from "./admin/Dashboard.jsx";
import AdminArtists from "./admin/AdminArtists.jsx";
import AdminServices from "./admin/AdminServices.jsx";
import AdminDesigns from "./admin/AdminDesigns.jsx";
import AdminBookings from "./admin/AdminBookings.jsx";
import AdminCustomRequests from "./admin/AdminCustomRequests.jsx";

const protect = (page) => <ProtectedRoute>{page}</ProtectedRoute>;
const Soon = ({ name }) => <p className="muted">{name} page is coming next.</p>;

export default function App() {
  const { user } = useAuth();
  const isAdmin = useLocation().pathname.startsWith("/admin");

  // The app opens at "/": not logged in -> Login, logged in -> Home (or Admin)
  const start = !user ? "/login" : user.role === "ADMIN" ? "/admin" : "/home";

  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to={start} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Browsing */}
      <Route path="/home" element={<Home />} />
      <Route path="/designs" element={<Designs />} />
      <Route path="/artists" element={<Artists />} />
      <Route path="/services" element={<Services />} />

      {/* Booking: login required */}
      <Route path="/booking" element={protect(<Booking />)} />
      <Route path="/cart" element={protect(<Cart />)} />
      <Route path="/payment" element={protect(<Payment />)} />
      <Route path="/my-bookings" element={protect(<MyBookings />)} />
      <Route path="/profile" element={protect(<Profile />)} />

      {/* Admin: role ADMIN only */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="custom-requests" element={<AdminCustomRequests />} />
        <Route path="artists" element={<AdminArtists />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="designs" element={<AdminDesigns />} />
      </Route>

      {/* Any unknown URL goes to the start page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  // Admin pages have their own sidebar, so no customer navbar or narrow container
  if (isAdmin) return routes;

  return (
    <>
      <Navbar />
      <main className="container">{routes}</main>
    </>
  );
}
