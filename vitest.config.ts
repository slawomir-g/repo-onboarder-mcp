import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Exclude e2e tests from unit test run if desired, but for now we include them
    // or we can exclude them and run them separately.
    // Given the E2E tests launch a separate process and might be slower, 
    // it's often good practice to separate them.
    // Let's exclude .e2e.test.ts from the default 'test' command unit tests
    // so `npm test` runs fast unit tests.
    exclude: ["**/node_modules/**"],
  },
});
