import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteStaticCopy } from "vite-plugin-static-copy";

/**
 * Builds the system into `dist/` with the layout Foundry expects at the root
 * of the packaged zip:
 *
 *   dist/
 *   ├── system.json
 *   ├── module/gluniverse-wod.js
 *   ├── styles/gluniverse-wod.css
 *   ├── styles/fonts/*.woff2
 *   └── lang/en.json
 *
 * Svelte 5 components are compiled and bundled into the single ES module that
 * Foundry loads; the Svelte runtime ships inside it (no external CDN).
 */
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    target: "es2022",
    lib: {
      entry: "src/module/gluniverse-wod.ts",
      formats: ["es"],
      fileName: () => "module/gluniverse-wod.js",
    },
    rollupOptions: {
      output: {
        // Svelte component styles are extracted into one predictable file so
        // the manifest can load it; the hand-written token/font sheet is copied
        // separately by viteStaticCopy.
        assetFileNames: (info) => {
          const name = info.names?.[0] ?? info.name ?? "";
          if (name.endsWith(".css")) return "styles/gluniverse-components.css";
          return "styles/[name][extname]";
        },
      },
    },
  },
  plugins: [
    svelte(),
    viteStaticCopy({
      targets: [
        { src: "system.json", dest: "." },
        { src: "lang", dest: "." },
        { src: "styles", dest: "." },
      ],
    }),
  ],
});
