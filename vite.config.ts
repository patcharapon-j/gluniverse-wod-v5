import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteStaticCopy } from "vite-plugin-static-copy";

/**
 * Empties `dist/` except `dist/packs`. Foundry holds a LevelDB lock on the
 * packs while a world using this system is open, so Vite's own emptyOutDir
 * dies with EPERM. `build-packs.mjs` owns that directory and rewrites it in
 * place, so leaving it behind is safe.
 */
function cleanDistExceptPacks(): Plugin {
  return {
    name: "gl-clean-dist-except-packs",
    apply: "build",
    buildStart() {
      const dist = resolve("dist");
      if (!existsSync(dist)) return;
      for (const entry of readdirSync(dist)) {
        if (entry === "packs") continue;
        rmSync(join(dist, entry), { recursive: true, force: true });
      }
    },
  };
}

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
/**
 * Writes the bundled component CSS to BOTH dist/styles/ and the source
 * styles/ dir. Foundry loads this repo folder directly during dev (root
 * `module/` and `packs/` are junctions into dist/, but `styles/` is the real
 * source dir), so system.json's styles/gluniverse-components.css must exist at
 * the root too. Writing from the in-memory bundle after all other plugins also
 * guarantees viteStaticCopy can't clobber dist with a stale root copy.
 */
function syncComponentsCss(): Plugin {
  return {
    name: "gl-sync-components-css",
    apply: "build",
    enforce: "post",
    writeBundle(_options, bundle) {
      const asset = bundle["styles/gluniverse-components.css"];
      if (asset && asset.type === "asset") {
        writeFileSync(resolve("styles/gluniverse-components.css"), asset.source);
        writeFileSync(resolve("dist/styles/gluniverse-components.css"), asset.source);
      }
    },
  };
}

export default defineConfig({
  build: {
    outDir: "dist",
    // Cleaning is done by cleanDistExceptPacks(); Vite's emptyOutDir would
    // rmSync dist/packs and EPERM while Foundry has the LevelDB open.
    emptyOutDir: false,
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
    cleanDistExceptPacks(),
    syncComponentsCss(),
    svelte(),
    viteStaticCopy({
      targets: [
        { src: "system.json", dest: "." },
        { src: "lang", dest: "." },
        { src: "styles", dest: "." },
        { src: "assets", dest: "." },
      ],
    }),
  ],
});
