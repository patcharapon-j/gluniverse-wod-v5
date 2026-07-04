/**
 * V5 character-creation rules, sourced from world settings so a Storyteller can
 * tune the starting budgets per campaign (see `registerSettings`). All limits
 * are SOFT: the builder compares against them and warns, it never blocks.
 */

import { CREATION_DEFAULTS, getSetting, SETTINGS } from "../settings.ts";

export interface SkillDistribution {
  key: string;
  label: string;
  target: number[];
}

export interface CreationRules {
  /** Attribute ratings, e.g. [4,3,3,3,2,2,2,2,1]. */
  attributeSpread: number[];
  /** The three optional skill distributions the player picks from. */
  skillDistributions: SkillDistribution[];
  /** In-clan Discipline dots granted at creation. */
  disciplineDots: number;
  /** Dots of Merits + Backgrounds. */
  advantageDots: number;
  /** Minimum dots of Flaws. */
  flawDots: number;
  /** Starting Blood Potency. */
  bloodPotency: number;
  /** Starting Humanity. */
  humanity: number;
}

/** Parse a "4,3,3,2" style spread into a descending list of ratings. */
export function parseSpread(raw: string): number[] {
  return String(raw ?? "")
    .split(/[^0-9]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => b - a);
}

/** The active creation rules, read from settings (falls back to book values). */
export function getCreationRules(): CreationRules {
  return {
    attributeSpread: parseSpread(
      getSetting<string>(SETTINGS.creationAttributes, CREATION_DEFAULTS.attributeSpread),
    ),
    skillDistributions: [
      {
        key: "jack",
        label: "Jack-of-all-Trades",
        target: parseSpread(getSetting<string>(SETTINGS.creationSkillsJack, CREATION_DEFAULTS.skillsJack)),
      },
      {
        key: "balanced",
        label: "Balanced",
        target: parseSpread(getSetting<string>(SETTINGS.creationSkillsBalanced, CREATION_DEFAULTS.skillsBalanced)),
      },
      {
        key: "specialist",
        label: "Specialist",
        target: parseSpread(getSetting<string>(SETTINGS.creationSkillsSpecialist, CREATION_DEFAULTS.skillsSpecialist)),
      },
    ],
    disciplineDots: getSetting<number>(SETTINGS.creationDisciplineDots, CREATION_DEFAULTS.disciplineDots),
    advantageDots: getSetting<number>(SETTINGS.creationAdvantageDots, CREATION_DEFAULTS.advantageDots),
    flawDots: getSetting<number>(SETTINGS.creationFlawDots, CREATION_DEFAULTS.flawDots),
    bloodPotency: getSetting<number>(SETTINGS.creationBloodPotency, CREATION_DEFAULTS.bloodPotency),
    humanity: getSetting<number>(SETTINGS.creationHumanity, CREATION_DEFAULTS.humanity),
  };
}

export interface SpreadCheck {
  ok: boolean;
  /** Dots currently assigned / dots the spread allows. */
  spent: number;
  budget: number;
  /** Human-readable deviations, empty when the spread matches exactly. */
  messages: string[];
}

/**
 * Compare assigned ratings against a target spread, per rating value. Both
 * over- and under-spending produce a message; neither blocks anything.
 */
export function compareSpread(current: number[], target: number[]): SpreadCheck {
  const counts = (list: number[]) => {
    const m = new Map<number, number>();
    for (const v of list) if (v > 0) m.set(v, (m.get(v) ?? 0) + 1);
    return m;
  };
  const cur = counts(current);
  const tgt = counts(target);
  const messages: string[] = [];
  const ratings = [...new Set([...cur.keys(), ...tgt.keys()])].sort((a, b) => b - a);
  for (const r of ratings) {
    const d = (cur.get(r) ?? 0) - (tgt.get(r) ?? 0);
    if (d > 0) messages.push(`${d} more rating${d > 1 ? "s" : ""} at ${r} than the spread allows`);
    if (d < 0) messages.push(`${-d} rating${d < -1 ? "s" : ""} at ${r} still to assign`);
  }
  return {
    ok: messages.length === 0,
    spent: current.reduce((n, v) => n + v, 0),
    budget: target.reduce((n, v) => n + v, 0),
    messages,
  };
}
