import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxies /api and /files to the Spring Boot backend during development
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
      "/files": "http://localhost:8080",
    },
  },
});
