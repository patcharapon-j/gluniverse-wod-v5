/**
 * Shared schema building blocks for World of Darkness actors. This is the "thin
 * WoD core" the splats build on: every mortal-derived being has the nine
 * attributes, the skill list, and Health / Willpower tracks.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ATTRIBUTE_KEYS, SKILL_KEYS } from "../config.ts";
import { int, str, html, schema, trait, skillField, trackField } from "./fields.ts";

/** SchemaField of the nine attributes (flat: `attributes.strength.value`). */
export const attributesField = (): any =>
  schema(Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, trait(1)])));

/** SchemaField of the twenty-seven skills. */
export const skillsField = (): any =>
  schema(Object.fromEntries(SKILL_KEYS.map((k) => [k, skillField()])));

/** Common descriptive fields shared by most actors. */
export const detailsField = (): any =>
  schema({
    concept: str(),
    chronicle: str(),
    ambition: str(),
    desire: str(),
  });

export { int, str, html, schema, trait, skillField, trackField };

/**
 * Derive the max on a damage track and clamp its marks. Health max = Stamina +
 * 3; Willpower max = Composure + Resolve. Called from prepareDerivedData.
 */
export function deriveTrack(track: any, max: number): void {
  track.max = Math.max(0, max);
  // Aggravated never exceeds the track; superficial fills what remains.
  track.aggravated = Math.min(track.aggravated, track.max);
  track.superficial = Math.min(track.superficial, track.max - track.aggravated);
  track.value = track.max - track.superficial - track.aggravated; // undamaged boxes
  track.damage = track.superficial + track.aggravated;
}
