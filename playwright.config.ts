import { defineConfig } from "@playwright/test";
import path from "node:path";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4180/whale-dashboard/",
    headless: true,
    channel: "msedge",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/preview.mjs",
    url: "http://127.0.0.1:4180/whale-dashboard/",
    reuseExistingServer: false,
    timeout: 30000,
    env: { PORT: "4180", DASHBOARD_DEMO_DIR: path.resolve(`.local/e2e-${Date.now()}`) },
  },
});
