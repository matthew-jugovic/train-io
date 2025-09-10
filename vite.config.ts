import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist", // Output directory for built files
    sourcemap: true, // Generate source maps
  },
  server: {
    watch: {
      ignored: ["**/src/server/**"],
    },
    allowedHosts: [
      "train-ga.me"
    ]
  }
});
