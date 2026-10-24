import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, lazyPlugins } from "vite-plus";
import devtoolsJson from "vite-plugin-devtools-json";
import path from "path";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "react-router build",
        dependsOn: [{ task: "build", from: "dependencies" }],
        cache: {
          env: ["VITE_*", "NODE_ENV"],
          input: [{ auto: true }, ".env*"],
          output: ["build/**", ".react-router/**", ".wrangler/deploy/**"],
        },
      },
      dev: {
        command: "react-router dev",
        dependsOn: [{ task: "build", from: "dependencies" }],
        cache: false,
      },
      "types:check": {
        command: "vp run types:generate && react-router typegen && tsc -b",
        dependsOn: [{ task: "build", from: "dependencies" }],
        cache: false,
      },
    },
  },
  plugins: lazyPlugins(() => [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    devtoolsJson(),
  ]),
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@/components": path.resolve(__dirname, "./app/components"),
      "@/lib": path.resolve(__dirname, "./app/lib"),
    },
  },
});
