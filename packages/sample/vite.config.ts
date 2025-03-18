import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// @ts-expect-error -- fixme
import cssModulesInJs from "vite-plugin-cssmodules-in-js";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [cssModulesInJs(), react()],
});
