/**
 * Rasterize the dice face SVGs in assets/dice/ to 256px PNGs alongside them.
 * Dice So Nice's texture loader wants raster images; the SVGs stay the source
 * of truth (and the chat cards mask them directly). Run: node scripts/build-dice-icons.mjs
 *
 * For each glyph we emit two PNGs:
 *   <name>.png       — the crisp glyph (label + emissive layers).
 *   <name>-bump.png  — a grayscale height map for DSN's bumpMaps.
 *
 * The bump map is NOT the flat glyph reused: a solid-white glyph has zero
 * interior gradient, and bump shading comes from the height *slope*, so a flat
 * fill reads as a dead-flat plateau with only a hairline rim. Instead we recolor
 * the glyph to white on an opaque black field and soft-blur it, turning the
 * whole shape into a sloped "repoussé" dome that catches light across its face.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "dice");

const render = (svg) =>
  new Resvg(svg, { fitTo: { mode: "width", value: 256 } }).render().asPng();

/**
 * Height map for a glyph: every painted colour becomes white on an opaque black
 * ground (bump reads luminance, not hue — a dark blood glyph would otherwise
 * emboss as a pit), then a gentle blur bevels the edges into slopes. `fill/
 * stroke="none"` is preserved so ring holes stay holes.
 */
function toBumpSvg(svg) {
  const white = svg.replace(
    /(fill|stroke)="#[0-9a-fA-F]{3,8}"/g,
    '$1="#ffffff"',
  );
  const open = white.match(/<svg[^>]*>/)[0];
  const body = white.slice(open.length, white.lastIndexOf("</svg>"));
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<defs><filter id="bevel" x="-20%" y="-20%" width="140%" height="140%">` +
    `<feGaussianBlur stdDev="1.6"/></filter></defs>` +
    `<rect width="100" height="100" fill="#000000"/>` +
    `<g filter="url(#bevel)">${body}</g>` +
    `</svg>`
  );
}

for (const file of readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  const svg = readFileSync(join(dir, file), "utf8");
  const base = file.replace(/\.svg$/, "");

  writeFileSync(join(dir, `${base}.png`), render(svg));
  console.log(`assets/dice/${base}.png`);

  writeFileSync(join(dir, `${base}-bump.png`), render(toBumpSvg(svg)));
  console.log(`assets/dice/${base}-bump.png`);
}
