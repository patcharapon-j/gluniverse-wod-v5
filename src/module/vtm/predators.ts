/**
 * Predator-type reference data: the mechanical benefits each hunting style
 * grants at character creation, in a structure the builder can read and apply
 * to the sheet.
 *
 * Benefits mirror the V5 line (Core, Cults of the Blood Gods, Let the Streets
 * Run Red, Players Guide, In Memoriam). Many are *choices* — one of several
 * specialties or Disciplines, or a pool of dots split among Backgrounds — so
 * each benefit carries its options and the builder resolves the player's pick.
 *
 * Advantage `name`s must match entries in the advantages compendium so the
 * grant can pull the real item (description, image) when applied.
 */

import type { Discipline, PredatorType, SkillKey, AdvantageKind } from "../config.ts";

/** A single skill specialty grant (choose one of the options). */
export interface SpecialtyBenefit {
  kind: "specialty";
  options: { skill: SkillKey; specialty: string }[];
}

/** A Discipline dot grant (choose one of the options). */
export interface DisciplineBenefit {
  kind: "discipline";
  dots: number;
  options: Discipline[];
  note?: string;
}

/** A fixed named Merit / Flaw / Background at a set dot value. */
export interface AdvantageBenefit {
  kind: "advantage";
  advKind: AdvantageKind;
  name: string;
  dots: number;
  note?: string;
}

/** Choose one of several named advantages. */
export interface AdvantageChoiceBenefit {
  kind: "advantageChoice";
  advKind: AdvantageKind;
  options: { name: string; dots: number; note?: string }[];
}

/** Split a pool of dots among the named advantages. */
export interface PoolBenefit {
  kind: "pool";
  advKind: AdvantageKind;
  dots: number;
  among: string[];
  note?: string;
}

/** A change to Humanity or Blood Potency. */
export interface TraitBenefit {
  kind: "trait";
  trait: "humanity" | "bloodPotency";
  delta: number;
}

export type PredatorBenefit =
  | SpecialtyBenefit
  | DisciplineBenefit
  | AdvantageBenefit
  | AdvantageChoiceBenefit
  | PoolBenefit
  | TraitBenefit;

export interface PredatorProfile {
  /** Original one-line summary of the feeding style. */
  summary: string;
  source: string;
  /** Clans that cannot take this predator type (keys), if any. */
  forbiddenClans?: string[];
  benefits: PredatorBenefit[];
}

const sp = (...options: { skill: SkillKey; specialty: string }[]): SpecialtyBenefit => ({ kind: "specialty", options });
const disc = (dots: number, options: Discipline[], note?: string): DisciplineBenefit => ({ kind: "discipline", dots, options, note });
const adv = (advKind: AdvantageKind, name: string, dots: number, note?: string): AdvantageBenefit => ({ kind: "advantage", advKind, name, dots, note });
const advChoice = (advKind: AdvantageKind, options: { name: string; dots: number; note?: string }[]): AdvantageChoiceBenefit => ({ kind: "advantageChoice", advKind, options });
const pool = (advKind: AdvantageKind, dots: number, among: string[], note?: string): PoolBenefit => ({ kind: "pool", advKind, dots, among, note });
const trait = (t: "humanity" | "bloodPotency", delta: number): TraitBenefit => ({ kind: "trait", trait: t, delta });

export const PREDATOR_INFO: Record<PredatorType, PredatorProfile> = {
  alleycat: {
    summary: "Hunt by ambush and intimidation, taking blood by force.",
    source: "Core",
    benefits: [
      sp({ skill: "intimidation", specialty: "Stickups" }, { skill: "brawl", specialty: "Grappling" }),
      disc(1, ["celerity", "potence"]),
      trait("humanity", -1),
      adv("background", "Contacts", 3, "Criminal contacts"),
    ],
  },
  bagger: {
    summary: "Drink stored, bagged, or stolen blood rather than the living.",
    source: "Core",
    forbiddenClans: ["ventrue"],
    benefits: [
      sp({ skill: "larceny", specialty: "Lockpicking" }, { skill: "streetwise", specialty: "Black Market" }),
      disc(1, ["bloodSorcery", "oblivion", "obfuscate"], "Blood Sorcery (Tremere/Banu Haqim), Oblivion (Hecata), or Obfuscate"),
      adv("merit", "Iron Gullet", 3),
      adv("flaw", "Enemy", 2),
    ],
  },
  bloodLeech: {
    summary: "Feed on the vitae of other Kindred instead of mortals.",
    source: "Core",
    benefits: [
      sp({ skill: "brawl", specialty: "Kindred" }, { skill: "stealth", specialty: "Against Kindred" }),
      disc(1, ["celerity", "protean"]),
      trait("humanity", -1),
      trait("bloodPotency", 1),
      advChoice("flaw", [{ name: "Dark Secret", dots: 2, note: "Diablerist" }, { name: "Shunned", dots: 2 }]),
      adv("flaw", "Prey Exclusion", 2, "Mortals"),
    ],
  },
  cleaver: {
    summary: "Feed secretly from your own maintained mortal family.",
    source: "Core",
    benefits: [
      sp({ skill: "persuasion", specialty: "Gaslighting" }, { skill: "subterfuge", specialty: "Coverups" }),
      disc(1, ["dominate", "animalism"]),
      adv("flaw", "Dark Secret", 1, "Cleaver"),
      adv("background", "Herd", 2),
    ],
  },
  consensualist: {
    summary: "Feed only from consenting, aware vessels.",
    source: "Core",
    benefits: [
      sp({ skill: "medicine", specialty: "Phlebotomy" }, { skill: "persuasion", specialty: "Vessels" }),
      disc(1, ["auspex", "fortitude"]),
      trait("humanity", 1),
      adv("flaw", "Dark Secret", 1, "Masquerade Breacher"),
      adv("flaw", "Prey Exclusion", 1, "Non-consenting"),
    ],
  },
  farmer: {
    summary: "Feed only from animals, clinging to your Humanity.",
    source: "Core",
    forbiddenClans: ["ventrue"],
    benefits: [
      sp({ skill: "animalKen", specialty: "Specific animal" }, { skill: "survival", specialty: "Hunting" }),
      disc(1, ["animalism", "protean"]),
      trait("humanity", 1),
      adv("flaw", "Farmer", 2),
    ],
  },
  osiris: {
    summary: "Feed from a cult or fan-following you cultivate.",
    source: "Core",
    benefits: [
      sp({ skill: "occult", specialty: "Specific tradition" }, { skill: "performance", specialty: "Specific field" }),
      disc(1, ["bloodSorcery", "presence"]),
      pool("background", 3, ["Fame", "Herd"]),
      pool("flaw", 2, ["Enemy"], "Split between Enemies and Mythic flaws"),
    ],
  },
  sandman: {
    summary: "Steal blood from sleeping victims by stealth.",
    source: "Core",
    benefits: [
      sp({ skill: "medicine", specialty: "Anesthetics" }, { skill: "stealth", specialty: "Break-in" }),
      disc(1, ["auspex", "obfuscate"]),
      adv("background", "Resources", 1),
    ],
  },
  sceneQueen: {
    summary: "Feed within a subculture or scene where you are adored.",
    source: "Core",
    benefits: [
      sp({ skill: "etiquette", specialty: "Specific scene" }, { skill: "leadership", specialty: "Specific scene" }, { skill: "streetwise", specialty: "Specific scene" }),
      disc(1, ["dominate", "potence"]),
      adv("background", "Fame", 1),
      adv("background", "Contacts", 1),
      advChoice("flaw", [{ name: "Disliked", dots: 1 }, { name: "Prey Exclusion", dots: 1, note: "A rival scene" }]),
    ],
  },
  siren: {
    summary: "Feed through seduction and feigned intimacy.",
    source: "Core",
    benefits: [
      sp({ skill: "persuasion", specialty: "Seduction" }, { skill: "subterfuge", specialty: "Seduction" }),
      disc(1, ["fortitude", "presence"]),
      adv("merit", "Beautiful", 2),
      adv("flaw", "Enemy", 1, "A spurned lover or jealous partner"),
    ],
  },
  extortionist: {
    summary: "Take blood in exchange for protection or services.",
    source: "Cults of the Blood Gods",
    benefits: [
      sp({ skill: "intimidation", specialty: "Coercion" }, { skill: "larceny", specialty: "Security" }),
      disc(1, ["dominate", "potence"]),
      pool("background", 3, ["Contacts", "Resources"]),
      adv("flaw", "Enemy", 2),
    ],
  },
  graverobber: {
    summary: "Feed on the freshly dead and the grieving.",
    source: "Cults of the Blood Gods",
    benefits: [
      sp({ skill: "occult", specialty: "Grave Rituals" }, { skill: "medicine", specialty: "Cadavers" }),
      disc(1, ["fortitude", "oblivion"]),
      adv("merit", "Iron Gullet", 3),
      adv("background", "Haven", 1),
      adv("flaw", "Obvious Predator", 2),
    ],
  },
  roadsideKiller: {
    summary: "Hunt travelers and the transient who won't be missed.",
    source: "Let the Streets Run Red",
    benefits: [
      sp({ skill: "survival", specialty: "The Road" }, { skill: "investigation", specialty: "Vampire Cant" }),
      disc(1, ["fortitude", "protean"]),
      adv("background", "Herd", 2, "Migrating herd"),
      adv("flaw", "Prey Exclusion", 1, "Locals"),
    ],
  },
  grimReaper: {
    summary: "Feed on the dying in hospices, homes, and hospitals.",
    source: "Players Guide",
    benefits: [
      sp({ skill: "awareness", specialty: "Death" }, { skill: "larceny", specialty: "Forgery" }),
      disc(1, ["auspex", "oblivion"]),
      trait("humanity", 1),
      pool("background", 1, ["Allies", "Influence"], "Medical community"),
      adv("flaw", "Prey Exclusion", 1, "Healthy mortals"),
    ],
  },
  montero: {
    summary: "Direct servants to drive prey toward you.",
    source: "Players Guide",
    benefits: [
      sp({ skill: "leadership", specialty: "Hunting Pack" }, { skill: "stealth", specialty: "Stakeout" }),
      disc(1, ["dominate", "obfuscate"]),
      trait("humanity", -1),
      adv("background", "Retainers", 2),
    ],
  },
  pursuer: {
    summary: "Stalk a chosen victim before striking.",
    source: "Players Guide",
    benefits: [
      sp({ skill: "investigation", specialty: "Profiling" }, { skill: "stealth", specialty: "Shadowing" }),
      disc(1, ["animalism", "auspex"]),
      trait("humanity", -1),
      adv("merit", "Bloodhound", 1),
      adv("background", "Contacts", 1),
    ],
  },
  trapdoor: {
    summary: "Lure prey into a nest you control.",
    source: "Players Guide",
    benefits: [
      sp({ skill: "persuasion", specialty: "Marketing" }, { skill: "stealth", specialty: "Ambushes" }),
      disc(1, ["protean", "obfuscate"]),
      adv("background", "Haven", 1),
      pool("background", 1, ["Retainers", "Herd", "Haven"]),
      advChoice("flaw", [{ name: "Haven: Creepy", dots: 1 }, { name: "Haven: Haunted", dots: 1 }]),
    ],
  },
  titheCollector: {
    summary: "Other Kindred pay you tribute in selected vessels.",
    source: "In Memoriam",
    benefits: [
      sp({ skill: "intimidation", specialty: "Kindred" }, { skill: "leadership", specialty: "Kindred" }),
      disc(1, ["dominate", "presence"]),
      adv("background", "Status", 3, "Or Domain, if using a coterie"),
      adv("flaw", "Adversary", 2),
    ],
  },
};

export function predatorProfile(key: string): PredatorProfile | undefined {
  return PREDATOR_INFO[key as PredatorType];
}
