import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    name: "web",
    include: ["app/**/*.test.ts", "app/**/*.test.tsx"],
  },
  resolve: {
    tsconfigPaths: true,
  },
});
