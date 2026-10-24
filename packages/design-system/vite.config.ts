import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
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
