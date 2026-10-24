import { defineConfig } from "vite-plus";
export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], environment: "node", testTimeout: 10000 },
  lint: { ignorePatterns: ["**/dist/**", "**/routeTree.gen.ts"], options: { typeAware: false } },
  fmt: { ignorePatterns: ["**/dist/**", "**/routeTree.gen.ts", "**/node_modules/**"] },
});
