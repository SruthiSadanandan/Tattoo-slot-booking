const BASE = "http://localhost:8080";

export function getToken() {
  return localStorage.getItem("token");
}

// Turns "/uploads/abc.jpg" into "http://localhost:8080/uploads/abc.jpg".
// Full http(s) URLs are left unchanged.
export const fileUrl = (u) =>
  !u ? "" : u.startsWith("http") ? u : `${BASE}${u}`;

// Login and register must never send an old token: a stale or expired
// token makes Spring Security reject the request before it reaches the controller.
const isAuthPath = (path) => path.startsWith("/auth/");

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};

  const token = getToken();
  if (token && !isAuthPath(path)) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: form ? form : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // Session expired: clear it and go to login (not for login/register themselves)
    if (res.status === 401 && !isAuthPath(path)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("cart");
      window.location.href = "/login";
    }

    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.message || data.error || message;
    } catch {
      /* non-JSON error body */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;

  // The backend may reply with JSON or with plain text (e.g. "Registration successful")
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  register: (name, email, password) =>
    request("/auth/register", { method: "POST", body: { name, email, password } }),

  // Catalogue
  designs: (style) =>
    request(`/designs${style && style !== "All" ? `?style=${encodeURIComponent(style)}` : ""}`),
  services: () => request("/services"),
  artists: () => request("/artists"),
  slots: (artistId, serviceId, date) =>
    request(`/artists/${artistId}/slots?serviceId=${serviceId}&date=${date}`),

  // Uploads
  uploadReference: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/api/files/reference", { method: "POST", form });
  },
  uploadDesignImage: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/designs/upload", { method: "POST", form });
  },

  // Bookings and payments
  createBooking: (payload) =>
    request("/bookings", {
      method: "POST",
      body: payload,
    }),

  myBookings: () => request("/bookings/mine"),

  cancelBooking: (id) =>
    request(`/bookings/${id}/cancel`, {
      method: "POST",
    }),

  createOrder: (bookingId) =>
    request("/api/payments/create-order", {
      method: "POST",
      body: { bookingId },
    }),

  verifyPayment: (payload) =>
    request("/api/payments/verify", {
      method: "POST",
      body: payload,
    }),
    demoConfirm: (bookingId) =>
    request("/api/payments/demo-confirm", {
      method: "POST",
      body: { bookingId },
    }),

  // Admin
  adminDashboard: () => request("/admin/dashboard"),

  adminBookings: () => request("/admin/bookings"),
  adminCancelBooking: (id) =>
    request(`/admin/bookings/${id}/cancel`, { method: "POST" }),
  adminCustomRequests: () => request("/admin/custom-requests"),
  adminApproveCustomRequest: (id, quotedPrice, adminNote) =>
    request(`/admin/custom-requests/${id}/approve`, {
      method: "POST",
      body: { quotedPrice, adminNote },
    }),
  adminRejectCustomRequest: (id, adminNote) =>
    request(`/admin/custom-requests/${id}/reject`, {
      method: "POST",
      body: { adminNote },
    }),

  adminCreateArtist: (data) => request("/artists", { method: "POST", body: data }),
  adminUpdateArtist: (id, data) => request(`/artists/${id}`, { method: "PUT", body: data }),
  adminDeleteArtist: (id) => request(`/artists/${id}`, { method: "DELETE" }),

  adminCreateDesign: (data) => request("/designs", { method: "POST", body: data }),
  adminUpdateDesign: (id, data) => request(`/designs/${id}`, { method: "PUT", body: data }),
  adminDeleteDesign: (id) => request(`/designs/${id}`, { method: "DELETE" }),

  adminCreateService: (data) => request("/services", { method: "POST", body: data }),
  adminUpdateService: (id, data) => request(`/services/${id}`, { method: "PUT", body: data }),
  adminDeleteService: (id) => request(`/services/${id}`, { method: "DELETE" }),
};