/**
 * Rasterize the dice face SVGs in assets/dice/ to 256px PNGs alongside them.
 * Dice So Nice's texture loader wants raster images; the SVGs stay the source
 * of truth (and the chat cards mask them directly). Run: node scripts/build-dice-icons.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "dice");

for (const file of readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  const svg = readFileSync(join(dir, file), "utf8");
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: 256 },
  }).render().asPng();
  const out = file.replace(/\.svg$/, ".png");
  writeFileSync(join(dir, out), png);
  console.log(`assets/dice/${out}`);
}
