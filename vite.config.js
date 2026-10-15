import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        roadmap: fileURLToPath(new URL("./roadmap/index.html", import.meta.url)),
        faq: fileURLToPath(new URL("./faq/index.html", import.meta.url)),
        account: fileURLToPath(new URL("./app/index.html", import.meta.url)),
        website: fileURLToPath(new URL("./index.html", import.meta.url)),
        demo: fileURLToPath(new URL("./demo/index.html", import.meta.url)),
      },
    },
  },
});
