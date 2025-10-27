import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy only the OAuth start/callback and API paths to the backend
      "/auth/google": "http://localhost:3000",
      "/auth/google/callback": "http://localhost:3000",
      "/api": "http://localhost:3000",
    },
  },
});
