/**
 * V5 experience costs. Advancing a trait costs its *new* rating times a
 * per-category multiplier (in-clan Disciplines are cheaper than out-of-clan).
 * These are the standard tabletop multipliers, encoded as data so the XP-spend
 * dialog and the character builder share one source of truth.
 */

import { inClanDisciplines } from "./clans.ts";
import type { Discipline } from "../config.ts";

export type XpCategory =
  | "attribute"
  | "skill"
  | "specialty"
  | "disciplineInClan"
  | "disciplineOutClan"
  | "disciplineCaitiff"
  | "ritual"
  | "ceremony"
  | "formula"
  | "advantage"
  | "bloodPotency";

/** Cost to raise `category` from `current` to `current + 1` dots. */
export function xpCost(category: XpCategory, current: number): number {
  const next = current + 1;
  switch (category) {
    case "attribute":
      return next * 5;
    case "skill":
      return next * 3;
    case "specialty":
      return 3;
    case "disciplineInClan":
      return next * 5;
    case "disciplineOutClan":
      return next * 7;
    case "disciplineCaitiff":
      return next * 6;
    case "ritual":
    case "ceremony":
    case "formula":
      // Priced by the level being learned, not a running rating.
      return current * 3;
    case "advantage":
      return next * 3;
    case "bloodPotency":
      return next * 10;
    default:
      return next * 5;
  }
}

/** Pick the right Discipline category for a clan (Caitiff/Thin-blood → caitiff rate). */
export function disciplineCategory(clan: string, discipline: string): XpCategory {
  if (clan === "caitiff" || clan === "thinBlood") return "disciplineCaitiff";
  return inClanDisciplines(clan).includes(discipline as Discipline)
    ? "disciplineInClan"
    : "disciplineOutClan";
}

export const XP_CATEGORY_LABEL: Record<XpCategory, string> = {
  attribute: "Attribute",
  skill: "Skill",
  specialty: "Specialty",
  disciplineInClan: "Discipline (in-clan)",
  disciplineOutClan: "Discipline (out-of-clan)",
  disciplineCaitiff: "Discipline (Caitiff)",
  ritual: "Blood Sorcery Ritual",
  ceremony: "Oblivion Ceremony",
  formula: "Thin-Blood Formula",
  advantage: "Advantage",
  bloodPotency: "Blood Potency",
};
