/**
 * Dice So Nice! integration for the system's custom dice types: `dv` (regular),
 * `dh` (Hunger) and `dr` (Rouse), all ten-sided (see ../dice/terms.ts). Presets
 * are keyed to the die type on a d10 shape — black resin with gold glyphs for
 * regular dice, blood red metal with white glyphs for Hunger, and polished bone
 * with blood-red glyphs for Rouse, so a Rouse check is unmistakable next to
 * Hunger dice. Faces reuse the glyph PNGs as bump maps for relief, and as
 * emissive maps on the faces that matter: the 10 on regular dice, the 1 and 10
 * on Hunger dice, every success face (6+) on Rouse dice. No-op when Dice So
 * Nice isn't installed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "../config.ts";

const BONE = "#efe8da";
const BLOOD = "#7d1013";
const BLOOD_LIGHT = "#f0d7d7";

/**
 * Glyph faces are pre-rasterized PNGs (see scripts/build-dice-icons.mjs): DSN's
 * texture loader wants raster image paths — `data:` URIs render as literal text
 * and SVGs fail to load.
 */
const ICON = (name: string) => `systems/${SYSTEM_ID}/assets/dice/${name}.png`;

type DieKind = "regular" | "hunger" | "rouse";

/**
 * Face labels, values 1..10: glyphs on 6+ (and Hunger 1), blank failures.
 * Regular dice use the gold glyph variants; Hunger dice stay white. Rouse dice
 * carry their own heart-and-bolt glyph on every success face — a Rouse check
 * has no crit or bane, so all that matters is success vs failure.
 */
function labels(kind: DieKind): string[] {
  const out: string[] = [];
  for (let n = 1; n <= 10; n++) {
    if (kind === "rouse") out.push(n >= 6 ? ICON("rouse") : " ");
    else if (n === 10) out.push(ICON(kind === "hunger" ? "messy" : "crit-gold"));
    else if (n >= 6) out.push(ICON(kind === "hunger" ? "mark" : "mark-gold"));
    else if (n === 1 && kind === "hunger") out.push(ICON("bestial"));
    else out.push(" "); // failure faces are blank, like the real dice
  }
  return out;
}

/** Bump maps mirror the labels so the glyphs read as raised relief. */
function bumpMaps(kind: DieKind): (string | undefined)[] {
  return labels(kind).map((l) => (l.endsWith(".png") ? l : undefined));
}

/**
 * Emission only on the faces that matter: 10 regular; 1 and 10 Hunger; every
 * success face on Rouse (the only question a Rouse check asks).
 */
function emissiveMaps(kind: DieKind): (string | undefined)[] {
  if (kind === "rouse") return bumpMaps(kind);
  const out: (string | undefined)[] = new Array(10).fill(undefined);
  out[9] = ICON(kind === "hunger" ? "messy" : "crit-gold");
  if (kind === "hunger") out[0] = ICON("bestial");
  return out;
}

export function registerDiceSoNice(): void {
  Hooks.once("diceSoNiceReady", (dice3d: any) => {
    try {
      dice3d.addSystem({ id: SYSTEM_ID, name: "GLUniverse — V5" }, "preferred");

      dice3d.addColorset({
        name: "gl-vampire",
        description: "GLUniverse — Kindred",
        category: "GLUniverse",
        foreground: "#d4af37",
        background: "#0b0b0d",
        outline: "none",
        edge: "#1a1a1e",
        // Untextured resin; the material must stay opaque — DSN's "glass"
        // material transmits light, so white faces read see-through.
        texture: "none",
        material: "resin",
        font: "Oswald",
        emissive: "#d4af37",
        emissiveIntensity: 0.14,
      });

      dice3d.addColorset({
        name: "gl-hunger",
        description: "GLUniverse — Hunger",
        category: "GLUniverse",
        foreground: "#ffffff",
        background: BLOOD,
        outline: "#3a0608",
        edge: "#e0b7b7",
        texture: "marble",
        material: "metal",
        font: "Oswald",
        emissive: "#ff2222",
        emissiveIntensity: 0.15,
      });

      // Rouse: the Hunger palette inverted — bone die, blood glyphs — so the
      // two can share a tray without ever reading as the same denomination.
      dice3d.addColorset({
        name: "gl-rouse",
        description: "GLUniverse — Rouse",
        category: "GLUniverse",
        foreground: BLOOD,
        background: BONE,
        outline: "#4a3f33",
        edge: BLOOD_LIGHT,
        texture: "none",
        material: "pristine",
        font: "Oswald",
        emissive: "#a8181d",
        emissiveIntensity: 0.12,
      });

      dice3d.addDicePreset(
        {
          type: "dv",
          labels: labels("regular"),
          bumpMaps: bumpMaps("regular"),
          emissiveMaps: emissiveMaps("regular"),
          emissive: "#d4af37",
          system: SYSTEM_ID,
          colorset: "gl-vampire",
        },
        "d10",
      );

      dice3d.addDicePreset(
        {
          type: "dh",
          labels: labels("hunger"),
          bumpMaps: bumpMaps("hunger"),
          emissiveMaps: emissiveMaps("hunger"),
          emissive: "#ff2222",
          system: SYSTEM_ID,
          colorset: "gl-hunger",
        },
        "d10",
      );

      dice3d.addDicePreset(
        {
          type: "dr",
          labels: labels("rouse"),
          bumpMaps: bumpMaps("rouse"),
          emissiveMaps: emissiveMaps("rouse"),
          emissive: "#a8181d",
          system: SYSTEM_ID,
          colorset: "gl-rouse",
        },
        "d10",
      );
    } catch (err) {
      console.warn(`${SYSTEM_ID} | Dice So Nice registration failed`, err);
    }
  });
}
