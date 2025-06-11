import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    hmr: {
      port: 8081,
    },
    port: 8080,
  },
  ssr: {
    noExternal: ["@phosphor-icons/react"], // fixes "too many open files" error
  },
  plugins: [tsConfigPaths(), tanstackStart()],
});
