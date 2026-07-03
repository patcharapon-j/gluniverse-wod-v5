import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

/**
 * Builds the system into `dist/` with the layout Foundry expects at the root
 * of the packaged zip:
 *
 *   dist/
 *   ├── system.json
 *   ├── template.json
 *   ├── module/gluniverse-wod.js
 *   ├── styles/gluniverse-wod.css
 *   └── lang/en.json
 */
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: "src/module/gluniverse-wod.ts",
      formats: ["es"],
      fileName: () => "module/gluniverse-wod.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "styles/[name][extname]",
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "system.json", dest: "." },
        { src: "template.json", dest: "." },
        { src: "lang", dest: "." },
        { src: "styles", dest: "." },
      ],
    }),
  ],
});
