import unpluginFragno from "@fragno-dev/unplugin-fragno/rollup";
import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "vp pack",
        cache: { output: ["dist/**"] },
      },
      test: {
        command: "vp test run",
        dependsOn: ["build"],
      },
    },
  },
  test: {
    name: "one-time-password-fragment",
    include: ["src/**/*.test.ts"],
  },
  pack: [
    {
      ignoreWatch: ["./dist"],
      entry: [
        "./src/index.ts",
        "./src/client/react.ts",
        "./src/client/svelte.ts",
        "./src/client/solid.ts",
        "./src/client/vanilla.ts",
        "./src/client/vue.ts",
      ],
      dts: true,
      platform: "browser",
      outDir: "./dist/browser",
      plugins: [unpluginFragno({ platform: "browser" })],
      deps: {
        neverBundle: [/^@fragno-dev\/db\//],
        alwaysBundle: [/^@fragno-dev\/core\//],
      },
    },
    {
      ignoreWatch: ["./dist"],
      entry: "./src/index.ts",
      dts: true,
      platform: "node",
      // Keep the .js and .d.ts paths used by this package's exports.
      fixedExtension: false,
      outDir: "./dist/node",
      plugins: [unpluginFragno({ platform: "node" })],
      deps: {
        neverBundle: [/^@fragno-dev\/db\//],
      },
    },
  ],
});
