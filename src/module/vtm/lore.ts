/**
 * Descriptive reference data for the three "state" tracks a player watches at
 * the table: Humanity, Blood Potency, and Resonance.
 *
 * Every string here is an ORIGINAL one-line summary of what a rule *does*
 * (dice bonuses/penalties, feeding limits, healing, torpor length). No rulebook
 * prose is reproduced. The hard mechanical numbers (surge dice, mend, bane,
 * rouse re-roll, Discipline bonus) are pulled from {@link BLOOD_POTENCY} so this
 * file and the dice engine can never disagree.
 */

import { BLOOD_POTENCY, RESONANCES, RESONANCE_INTENSITIES } from "../config.ts";
import type { Resonance, Discipline } from "../config.ts";

export interface LevelInfo {
  /** One-line characterisation of the level. */
  blurb: string;
  /** Bulleted mechanical effects that apply at this level. */
  effects: string[];
}

/** Humanity 0–10: index by rating. */
export const HUMANITY_INFO: LevelInfo[] = [
  {
    blurb: "The Beast has won — a final Wassail frenzy.",
    effects: [
      "Physical Attributes surge to 5 for the last scene.",
      "Survive it and the character becomes a Storyteller-run wight.",
    ],
  },
  {
    blurb: "Teetering on the edge; only survival matters.",
    effects: [
      "Eight-dice penalty to interact with mortals (five with Blush of Life).",
      "Torpor lasts roughly five centuries.",
    ],
  },
  {
    blurb: "Twisted pleasures, no care for others.",
    effects: [
      "Six-dice penalty to interact with mortals (four with Blush of Life).",
      "Torpor lasts roughly one century.",
    ],
  },
  {
    blurb: "Scraping the bottom — whatever keeps you safe.",
    effects: [
      "Four-dice penalty to interact with mortals.",
      "Can no longer fake intimacy.",
      "Torpor lasts roughly five decades.",
    ],
  },
  {
    blurb: "Killing feels acceptable; the body looks corpse-like.",
    effects: [
      "Two-dice penalty to interact with mortals.",
      "Even with Blush of Life, food and drink no longer stay down.",
      "Torpor lasts roughly a decade.",
    ],
  },
  {
    blurb: "Only Touchstones still matter; minor eeriness shows.",
    effects: [
      "One-die penalty on most Social pools with mortals — insight, persuasion, art — but not intimidation, hunting, or supernatural seduction.",
      "Two-dice penalty to fake intimacy.",
      "Torpor lasts roughly a year.",
    ],
  },
  {
    blurb: "No monster, but will do what it takes to survive.",
    effects: [
      "One-die penalty to fake intimacy.",
      "Even with Blush of Life, a Composure + Stamina test (Diff 3) is needed to hold food down an hour.",
      "Torpor lasts roughly a month.",
    ],
  },
  {
    blurb: "Passes for mortal; murder still reads as wrong.",
    effects: [
      "Blush of Life costs a Rouse Check.",
      "Fake intimacy by winning Dexterity + Charisma vs the partner's Composure or Wits.",
      "Without Blush of Life, food and drink are rejected — Composure + Stamina (Diff 3) to reach somewhere safe.",
      "Torpor lasts roughly two weeks.",
    ],
  },
  {
    blurb: "Still feels the pain of the harm it causes.",
    effects: [
      "Roll two dice for Blush of Life and keep the higher.",
      "With Blush of Life, can taste and digest wine.",
      "Can rise an hour before sunset.",
      "Torpor lasts roughly a week.",
    ],
  },
  {
    blurb: "More humane than most humans, almost unconsciously.",
    effects: [
      "Appears merely ill without Blush of Life.",
      "Heals Superficial damage as a mortal, on top of vampiric healing.",
      "Can taste and digest rare or raw meat and many liquids.",
      "Rises up to an hour before sunset and lingers an hour past dawn.",
      "Torpor lasts roughly three days.",
    ],
  },
  {
    blurb: "Vanishingly rare — barely distinguishable from the living.",
    effects: [
      "Passes as a pale, healthy mortal with no Blush of Life.",
      "Heals Superficial damage as a mortal, on top of vampiric healing.",
      "Can taste, eat, and digest food like a human.",
      "Can stay awake through the day (but must sleep at some point).",
      "Sunlight damage is halved.",
    ],
  },
];

/** Extra feeding / special notes per Blood Potency level (0–10). */
const BLOOD_POTENCY_NOTES: string[][] = [
  [
    "Thin-blood — Blood Potency cannot rise above 0 (short of diablerie past Generation 14).",
    "Cannot forge Blood Bonds, Embrace with certainty, or create ghouls.",
    "Frenzy only when a supernatural force forces it.",
    "Take 1 Superficial damage per turn in sunlight.",
  ],
  [],
  ["Animal and bagged blood slake half as much Hunger."],
  ["Animal and bagged blood no longer slake Hunger."],
  ["Animal and bagged blood slake nothing; each human slakes 1 less."],
  ["Animal and bagged blood slake nothing; 1 less per human; must drain a human to drop below Hunger 2."],
  ["Animal and bagged blood slake nothing; 2 less per human; must drain a human to drop below Hunger 2."],
  ["Animal and bagged blood slake nothing; 2 less per human; must drain a human to drop below Hunger 2."],
  ["Animal and bagged blood slake nothing; 2 less per human; must drain a human to drop below Hunger 3."],
  ["Animal and bagged blood slake nothing; 2 less per human; must drain a human to drop below Hunger 3."],
  ["Animal and bagged blood slake nothing; 3 less per human; must drain a human to drop below Hunger 3."],
];

/** Build the bullet list for a Blood Potency rating from the shared table. */
export function bloodPotencyInfo(bp: number): { blurb: string; effects: string[] } {
  const lvl = Math.max(0, Math.min(10, Math.floor(bp)));
  const t = BLOOD_POTENCY[lvl]!;
  const effects: string[] = [
    `Add ${t.surge} ${t.surge === 1 ? "die" : "dice"} when Blood Surging.`,
    `Mend ${t.mend} Superficial damage per Rouse Check.`,
  ];
  if (t.powerBonus > 0) effects.push(`Add ${t.powerBonus} ${t.powerBonus === 1 ? "die" : "dice"} to Discipline pools.`);
  if (t.rouseReroll > 0) effects.push(`Reroll a failed Rouse Check for Disciplines of level ${t.rouseReroll} or lower.`);
  if (t.bane > 0) effects.push(`Bane Severity ${t.bane}.`);
  for (const n of BLOOD_POTENCY_NOTES[lvl] ?? []) effects.push(n);

  const blurb =
    lvl === 0
      ? "Thinned Blood — the mortal world is still close."
      : lvl >= 6
        ? "Elder potency — alien in mind and body (Storyteller territory)."
        : "The Blood thickens with age; feeding grows harder.";
  return { blurb, effects };
}

export interface ResonanceInfo {
  /** Disciplines an Intense/Acute draught of this Resonance empowers. */
  disciplines: Discipline[];
  /** Original summary of the emotions that carry this Resonance. */
  emotions: string;
}

export const RESONANCE_INFO: Record<Resonance, ResonanceInfo> = {
  sanguine: { disciplines: ["bloodSorcery", "presence"], emotions: "Happy, enthusiastic, lustful, addicted, lively." },
  choleric: { disciplines: ["celerity", "potence"], emotions: "Angry, violent, passionate, bullying, envious." },
  melancholy: { disciplines: ["fortitude", "obfuscate"], emotions: "Sad, scared, depressed, intellectual, grounded." },
  phlegmatic: { disciplines: ["auspex", "dominate"], emotions: "Calm, lazy, apathetic, controlling, sentimental." },
  empty: { disciplines: ["oblivion"], emotions: "Emotionally detached or sociopathic." },
  animal: { disciplines: ["animalism", "protean"], emotions: "Animal blood — tied to no human emotion." },
};

export interface IntensityInfo {
  /** Bonus dice this temperament grants to the Resonance's Disciplines. */
  dice: number;
  blurb: string;
}

export const RESONANCE_INTENSITY_INFO: Record<string, IntensityInfo> = {
  fleeting: { dice: 0, blurb: "A passing mood — no bonus, but it justifies buying dots in the linked Disciplines." },
  intense: { dice: 1, blurb: "+1 die to the linked Disciplines until the next drink or Hunger 5." },
  acute: { dice: 1, blurb: "+1 die to the linked Disciplines, and can yield a Dyscrasia when the vessel is drained." },
};

/**
 * The Discipline die-bonus an actor's current Resonance grants. Fleeting and
 * unset temperaments give nothing; Intense and Acute give +1 to the linked
 * Disciplines.
 */
export function resonanceDieBonus(resonance: { type?: string; intensity?: string } | undefined): {
  dice: number;
  disciplines: Discipline[];
} {
  const type = resonance?.type ?? "";
  const intensity = resonance?.intensity ?? "";
  if (!type || !(type in RESONANCE_INFO)) return { dice: 0, disciplines: [] };
  const dice = RESONANCE_INTENSITY_INFO[intensity]?.dice ?? 0;
  return { dice, disciplines: RESONANCE_INFO[type as Resonance].disciplines };
}

// Re-exported for callers that iterate the fixed orders.
export { RESONANCES, RESONANCE_INTENSITIES };
