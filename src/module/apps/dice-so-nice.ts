/**
 * Dice So Nice! integration. Registers a GLUniverse dice system with two d10
 * presets — bone-on-black regular dice and bone-on-blood Hunger dice — using
 * original SVG face art (a maker's mark on the 10, a blood drop on the Hunger 1).
 * All of this is a no-op when Dice So Nice isn't installed; the {@link rollPool}
 * terms are tagged so the module colours Hunger dice red automatically.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "../config.ts";

const INK = "#161009";
const BONE = "#efe8da";
const BLOOD = "#7d1013";
const BLOOD_LIGHT = "#f0d7d7";

/** A d10 face rendered as an SVG data URI. Special glyphs on 10 (and Hunger 1). */
function face(label: string, fg: string, glyph?: "mark" | "drop"): string {
  const inner = glyph === "mark"
    ? `<path d="M50 18 L62 44 L50 40 L38 44 Z" fill="${fg}"/><circle cx="50" cy="62" r="12" fill="none" stroke="${fg}" stroke-width="5"/>`
    : glyph === "drop"
      ? `<path d="M50 20 C50 20 74 52 74 66 a24 24 0 1 1 -48 0 C26 52 50 20 50 20 Z" fill="${fg}"/>`
      : `<text x="50" y="50" font-family="Oswald, Arial Narrow, sans-serif" font-size="58" font-weight="600" fill="${fg}" text-anchor="middle" dominant-baseline="central">${label}</text>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/** Ten face labels for a d10 (index 0 = the "0"/10 face in DSN ordering). */
function d10Labels(fg: string, hunger: boolean): string[] {
  const labels: string[] = [];
  for (let n = 1; n <= 10; n++) {
    if (n === 10) labels.push(face("10", fg, "mark"));
    else if (n === 1 && hunger) labels.push(face("1", fg, "drop"));
    else labels.push(face(String(n), fg));
  }
  // DSN d10 wants a leading placeholder for the unused index 0.
  return ["", ...labels];
}

export function registerDiceSoNice(): void {
  Hooks.once("diceSoNiceReady", (dice3d: any) => {
    try {
      dice3d.addSystem({ id: SYSTEM_ID, name: "GLUniverse — V5" }, "preferred");

      dice3d.addColorset({
        name: "gl-vampire",
        description: "GLUniverse — Kindred",
        category: "GLUniverse",
        foreground: BONE,
        background: INK,
        outline: "#000000",
        edge: BLOOD,
        texture: "marble",
        material: "glass",
        font: "Oswald",
      });

      dice3d.addColorset({
        name: "gl-hunger",
        description: "GLUniverse — Hunger",
        category: "GLUniverse",
        foreground: BLOOD_LIGHT,
        background: BLOOD,
        outline: "#3a0608",
        edge: "#e0b7b7",
        texture: "marble",
        material: "metal",
        font: "Oswald",
      });

      dice3d.addDicePreset({
        type: "d10",
        labels: d10Labels(BONE, false),
        system: SYSTEM_ID,
        colorset: "gl-vampire",
      });

      dice3d.addDicePreset({
        type: "d10",
        labels: d10Labels(BLOOD_LIGHT, true),
        system: SYSTEM_ID,
        colorset: "gl-hunger",
      });
    } catch (err) {
      console.warn(`${SYSTEM_ID} | Dice So Nice registration failed`, err);
    }
  });
}
