import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "vite-plugin-cssmodules-in-js",
      formats: ["es", "cjs"],
      fileName: (format) => {
        if (format === "cjs") {
          return "cjs/vite-plugin-cssmodules-in-js.cjs";
        }
        return "es/vite-plugin-cssmodules-in-js.js";
      },
    },
  },
});
