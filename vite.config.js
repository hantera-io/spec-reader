import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { contentPlugin } from "./server/content-plugin.js";

const packageDir = dirname(fileURLToPath(import.meta.url));

export default function defineSpecReaderConfig({ target, mode, contentRoot }) {
  return {
    root: packageDir,
    configFile: false,
    resolve: {
      alias: {
        "@": resolve(packageDir, "src"),
      },
    },
    plugins: [vue(), contentPlugin({ target, mode, contentRoot })],
    server: {
      fs: {
        allow: [packageDir, contentRoot],
      },
    },
  };
}
