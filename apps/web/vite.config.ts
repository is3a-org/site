import path from "node:path";

import { reactRouter } from "@react-router/dev/vite";
import devtoolsJson from "vite-plugin-devtools-json";
import { defineConfig, lazyPlugins } from "vite-plus";

import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "react-router build",
        // The design system exports source; only the fragment needs a build before consumption.
        dependsOn: ["@is3a/one-time-password-fragment#build"],
        cache: {
          env: ["VITE_*", "NODE_ENV"],
          input: [{ auto: true }, ".env*"],
          output: ["build/**", ".react-router/**", ".wrangler/deploy/**"],
        },
      },
      dev: {
        command: "react-router dev",
        dependsOn: ["@is3a/one-time-password-fragment#build"],
        cache: false,
      },
      "types:check": {
        command: "vp run types:generate && react-router typegen && tsc -b",
        dependsOn: ["@is3a/one-time-password-fragment#build"],
        cache: false,
      },
      test: {
        command: "vp test run --config vitest.config.ts",
      },
    },
  },
  plugins: lazyPlugins(() => [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    devtoolsJson(),
  ]),
  optimizeDeps: {
    // Scan linked source up front instead of re-optimizing its dependencies on first use.
    entries: ["../../packages/design-system/src/components/*.tsx", "!**/*.stories.tsx"],
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@/components": path.resolve(import.meta.dirname, "./app/components"),
      "@/lib": path.resolve(import.meta.dirname, "./app/lib"),
    },
  },
});
