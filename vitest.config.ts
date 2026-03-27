import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: [],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/game/**/*.ts", "src/game/**/*.tsx"],
      exclude: ["node_modules/", "dist/", "**/*.d.ts", "**/*.config.ts"],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 78,
        branches: 63,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
