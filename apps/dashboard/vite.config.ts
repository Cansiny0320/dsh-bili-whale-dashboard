import { defineConfig } from "vite-plus";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
const releaseBuild = process.env.DASHBOARD_RELEASE === "1";
export default defineConfig({
  base: "/whale-dashboard/",
  publicDir: releaseBuild ? false : undefined,
  build: { license: releaseBuild },
  define: {
    "import.meta.env.VITE_HAS_LOCAL_PORTRAIT": JSON.stringify(
      !releaseBuild &&
        existsSync(fileURLToPath(new URL("./public/brand/whalechan.webp", import.meta.url))),
    ),
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [tailwindcss(), tanstackStart(), react()],
  server: { host: "127.0.0.1", port: 4178, strictPort: true },
});
