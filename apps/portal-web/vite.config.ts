import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5172,
    strictPort: true,
    host: true,
    // Same-origin /api in dev, mirroring production where the API
    // serves the web dist. Lets the hub POST server-to-server style
    // handshakes (POST <origin>/api/authorize) through in dev.
    proxy: {
      "/api": "http://localhost:4002",
    },
  },
  preview: {
    port: 5172,
  },
});
