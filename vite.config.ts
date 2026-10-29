import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    rolldownOptions: { input: { main: "index.html", plan: "plan.html" } },
    // The 3D page bundles three.js, about 700 kB on its own.
    chunkSizeWarningLimit: 900
  },
  server: { host: "127.0.0.1", port: 4731, strictPort: true },
  preview: { host: "127.0.0.1", port: 4731, strictPort: true },
  test: { include: ["tests/**/*.test.ts"], environment: "node" }
});
