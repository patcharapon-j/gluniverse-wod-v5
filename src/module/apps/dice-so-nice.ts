/**
 * Dice So Nice! integration for the system's custom dice types: `dv` (regular)
 * and `dh` (Hunger), both ten-sided (see ../dice/terms.ts). Presets are keyed to
 * the die type on a d10 shape — black resin with gold glyphs for regular
 * dice, blood red with white glyphs for Hunger. Faces reuse the glyph PNGs as bump maps
 * for relief, and as emissive maps on the faces that matter: the 10 on regular
 * dice, the 1 and 10 on Hunger dice. No-op when Dice So Nice isn't installed.
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

/**
 * Face labels, values 1..10: glyphs on 6+ (and Hunger 1), blank failures.
 * Regular dice use the gold glyph variants; Hunger dice stay white.
 */
function labels(hunger: boolean): string[] {
  const out: string[] = [];
  for (let n = 1; n <= 10; n++) {
    if (n === 10) out.push(ICON(hunger ? "messy" : "crit-gold"));
    else if (n >= 6) out.push(ICON(hunger ? "mark" : "mark-gold"));
    else if (n === 1 && hunger) out.push(ICON("bestial"));
    else out.push(" "); // failure faces are blank, like the real dice
  }
  return out;
}

/** Bump maps mirror the labels so the glyphs read as raised relief. */
function bumpMaps(hunger: boolean): (string | undefined)[] {
  return labels(hunger).map((l) => (l.endsWith(".png") ? l : undefined));
}

/** Emission only on the faces that matter: 10 regular; 1 and 10 Hunger. */
function emissiveMaps(hunger: boolean): (string | undefined)[] {
  const out: (string | undefined)[] = new Array(10).fill(undefined);
  out[9] = ICON(hunger ? "messy" : "crit-gold");
  if (hunger) out[0] = ICON("bestial");
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

      dice3d.addDicePreset(
        {
          type: "dv",
          labels: labels(false),
          bumpMaps: bumpMaps(false),
          emissiveMaps: emissiveMaps(false),
          emissive: "#d4af37",
          system: SYSTEM_ID,
          colorset: "gl-vampire",
        },
        "d10",
      );

      dice3d.addDicePreset(
        {
          type: "dh",
          labels: labels(true),
          bumpMaps: bumpMaps(true),
          emissiveMaps: emissiveMaps(true),
          emissive: "#ff2222",
          system: SYSTEM_ID,
          colorset: "gl-hunger",
        },
        "d10",
      );
    } catch (err) {
      console.warn(`${SYSTEM_ID} | Dice So Nice registration failed`, err);
    }
  });
}
