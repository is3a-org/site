import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    name: "design-system",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  run: {
    tasks: {
      test: {
        command: "vp test run",
      },
      build: {
        command: "storybook build --output-dir storybook-static --quiet",
        cache: {
          input: [{ auto: true }, "!node_modules/.cache/**", "!storybook-static/**"],
          output: ["storybook-static/**"],
        },
      },
    },
  },
});
