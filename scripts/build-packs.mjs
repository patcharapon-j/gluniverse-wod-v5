/**
 * Compiles compendium source content into LevelDB packs under `dist/packs/`.
 *
 * Source content lives in `src/packs-src/*.mjs` as compact, normalized document
 * objects (see `_helpers.mjs`). This script:
 *   1. assigns each document a STABLE `_id` derived from its pack + name, so
 *      re-builds keep the same ids and actors that reference pack items stay
 *      linked;
 *   2. stages each document as JSON in a temp dir;
 *   3. runs the Foundry CLI `compilePack` into `dist/packs/<name>`.
 *
 * Run after `vite build` (which empties `dist/`). Wired into `npm run build`.
 */

import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src", "packs-src");
const OUT = join(ROOT, "dist", "packs");

/** Deterministic 16-char id (hex is a valid Foundry id charset). */
const stableId = (key) => createHash("sha1").update(key).digest("hex").slice(0, 16);

/**
 * Each pack: source module, output dir name, Foundry document class, and the
 * LevelDB key collection prefix. `label`/`type` also feed system.json.
 */
const PACKS = [
  { name: "disciplines", module: "disciplines.mjs", collection: "items", docType: "Item" },
  { name: "rituals", module: "rituals.mjs", collection: "items", docType: "Item" },
  { name: "ceremonies", module: "ceremonies.mjs", collection: "items", docType: "Item" },
  { name: "advantages", module: "advantages.mjs", collection: "items", docType: "Item" },
  { name: "equipment", module: "equipment.mjs", collection: "items", docType: "Item" },
  { name: "lore", module: "lore.mjs", collection: "journal", docType: "JournalEntry" },
];

/** Wrap a normalized Item doc with id/key and the fields Foundry expects. */
function itemDoc(packName, entry) {
  const id = stableId(`${packName}:${entry.type}:${entry.name}`);
  return {
    _id: id,
    _key: `!items!${id}`,
    name: entry.name,
    type: entry.type,
    img: entry.img,
    system: entry.system,
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
  };
}

/** Wrap a normalized JournalEntry doc (with embedded pages) with id/key. */
function journalDoc(packName, entry) {
  const id = stableId(`${packName}:journal:${entry.name}`);
  const pages = entry.pages.map((pg, i) => {
    const pid = stableId(`${id}:page:${i}:${pg.name}`);
    return {
      _id: pid,
      _key: `!journal.pages!${id}.${pid}`,
      name: pg.name,
      type: pg.type,
      title: pg.title,
      sort: pg.sort,
      text: pg.text,
      flags: {},
    };
  });
  const doc = {
    _id: id,
    _key: `!journal!${id}`,
    name: entry.name,
    pages,
    folder: null,
    sort: 0,
    flags: entry.flags ?? {},
  };
  if (entry.img) doc.img = entry.img;
  return doc;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const summary = [];

  for (const pack of PACKS) {
    const mod = await import(pathToFileURL(join(SRC, pack.module)).href);
    const entries = mod.default;
    if (!Array.isArray(entries)) {
      throw new Error(`${pack.module} must default-export an array (got ${typeof entries})`);
    }

    const stage = mkdtempSync(join(tmpdir(), `glpack-${pack.name}-`));
    const seen = new Set();
    let n = 0;
    for (const entry of entries) {
      const doc = pack.docType === "JournalEntry" ? journalDoc(pack.name, entry) : itemDoc(pack.name, entry);
      if (seen.has(doc._id)) {
        throw new Error(`Duplicate id in pack "${pack.name}" for "${entry.name}" — rename to disambiguate.`);
      }
      seen.add(doc._id);
      writeFileSync(join(stage, `${doc._id}.json`), JSON.stringify(doc, null, 2));
      n++;
    }

    const dest = join(OUT, pack.name);
    await compilePack(stage, dest, { log: false });
    rmSync(stage, { recursive: true, force: true });
    summary.push(`  ${pack.name.padEnd(14)} ${String(n).padStart(4)} docs`);
  }

  console.log("Compiled compendium packs:");
  console.log(summary.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
