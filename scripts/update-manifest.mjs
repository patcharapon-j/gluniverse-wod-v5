#!/usr/bin/env node
/**
 * Rewrites system.json for a release:
 *   - sets `version` to the newly bumped value
 *   - points `manifest` at the stable "latest" release asset (so Foundry can
 *     detect future updates)
 *   - points `download` at the versioned zip for this specific release
 *
 * Usage: node scripts/update-manifest.mjs <version> <owner/repo>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , version, repo] = process.argv;

if (!version || !repo) {
  console.error("Usage: node scripts/update-manifest.mjs <version> <owner/repo>");
  process.exit(1);
}

const manifestPath = new URL("../system.json", import.meta.url);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const base = `https://github.com/${repo}`;

manifest.version = version;
manifest.url = base;
manifest.manifest = `${base}/releases/latest/download/system.json`;
manifest.download = `${base}/releases/download/v${version}/system.zip`;
manifest.readme = `${base}/blob/main/README.md`;
manifest.bugs = `${base}/issues`;
manifest.license = `${base}/blob/main/LICENSE`;

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Updated system.json → v${version} for ${repo}`);
