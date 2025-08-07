import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    hmr: {
      port: 8081,
    },
    host: "0.0.0.0",
    port: 8080,
  },
  ssr: {
    noExternal: ["@phosphor-icons/react"], // fixes "too many open files" error
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart({ customViteReactPlugin: true }),
    react(),
  ],
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["e2e/**"],
  },
});
