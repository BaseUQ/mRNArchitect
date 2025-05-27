import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  tsr: {
    appDirectory: "src",
  },
  vite: {
    ssr: {
      noExternal: ["@phosphor-icons/react"],
    },
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
    ],
  },
  routers: {
    client: {
      vite: {
        // @ts-ignore
        server: {
          hmr: {
            port: 8081,
          },
        },
      },
    },
  },
});
