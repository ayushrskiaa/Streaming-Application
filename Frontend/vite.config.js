import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Classic Tailwind setup using postcss + tailwind.config.js
// Tailwind is wired via postcss.config.js and src/index.css (@tailwind directives),
// so we only need the React plugin here.
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.VITE_DEV_SERVER_PORT) || 5173,
  },
});
