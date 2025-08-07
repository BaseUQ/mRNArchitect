import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";

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
    viteReact(),
    tsConfigPaths(),
    tanstackStart({ customViteReactPlugin: true }),
  ],
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**"],
  },
});
