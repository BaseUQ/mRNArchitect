import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

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
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      serverFns: {
        generateFunctionId: ({ filename, functionName }) =>
          `${filename}-${functionName}`,
      },
      srcDirectory: "src",
    }),
    nitro(),
    viteReact(),
  ],
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**"],
  },
});
