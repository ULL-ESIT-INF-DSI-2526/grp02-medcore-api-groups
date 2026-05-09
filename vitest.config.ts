import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
  },
});