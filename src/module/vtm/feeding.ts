/**
 * V5 feeding / slaking logic — pure, UI-free.
 *
 * Slaking a point of Hunger removes it; Hunger runs 0–5. Per V5 core, most
 * vampires cannot slake to Hunger 0 without draining a vessel to death — normal
 * feeding bottoms out at Hunger 1. Blood Potency further restricts *what* blood
 * works: at higher Potency animal and bagged blood slake less (or nothing),
 * humans slake fewer points, and only killing a human can push Hunger below a
 * rising floor.
 *
 * The Blood-Potency restrictions here are the encoded form of the per-level
 * feeding notes documented in {@link ./lore.ts} (`BLOOD_POTENCY_NOTES`); keep
 * the two in sync.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type FeedingSourceId = "bagged" | "animal" | "humanSip" | "humanHarmful" | "humanKill";

export interface FeedingSource {
  id: FeedingSourceId;
  /** Localization key for the source label. */
  labelKey: string;
  /** Plain-English fallback label. */
  label: string;
  /** Base Hunger slaked at Blood Potency 0–1 (before restrictions). "all" = drain to 0. */
  slake: number | "all";
  /** Whether this source is human blood (affected by the per-human penalty). */
  human: boolean;
  /** Whether this source is animal or bagged/cold blood (affected by those restrictions). */
  animalOrBagged: boolean;
  /** Whether taking this source kills the vessel (only path to Hunger 0 for most vampires). */
  kills: boolean;
  notes?: string;
}

/** The V5-core feeding sources a vampire can draw on. */
export const FEEDING_SOURCES: FeedingSource[] = [
  {
    id: "bagged",
    labelKey: "GLUNIVERSE.Feeding.bagged",
    label: "Bagged / Cold Blood",
    slake: 1,
    human: false,
    animalOrBagged: true,
    kills: false,
    notes: "Blood-bank or preserved blood. Slakes less as Blood Potency rises, then nothing.",
  },
  {
    id: "animal",
    labelKey: "GLUNIVERSE.Feeding.animal",
    label: "Animal",
    slake: 1,
    human: false,
    animalOrBagged: true,
    kills: false,
    notes: "Feeding from a beast. Slakes less as Blood Potency rises, then nothing.",
  },
  {
    id: "humanSip",
    labelKey: "GLUNIVERSE.Feeding.humanSip",
    label: "Sip from a Human",
    slake: 1,
    human: true,
    animalOrBagged: false,
    kills: false,
    notes: "A discreet, non-lethal drink.",
  },
  {
    id: "humanHarmful",
    labelKey: "GLUNIVERSE.Feeding.humanHarmful",
    label: "Harmful Drink from a Human",
    slake: 2,
    human: true,
    animalOrBagged: false,
    kills: false,
    notes: "A deeper, injurious feed that leaves the mortal harmed but alive.",
  },
  {
    id: "humanKill",
    labelKey: "GLUNIVERSE.Feeding.humanKill",
    label: "Drain & Kill a Human",
    slake: "all",
    human: true,
    animalOrBagged: false,
    kills: true,
    notes: "Draining a mortal to death — the only reliable way to reach Hunger 0.",
  },
];

export function getFeedingSource(id: string): FeedingSource | undefined {
  return FEEDING_SOURCES.find((s) => s.id === id);
}

/** How animal and bagged blood behave at a given Blood Potency. */
export type AnimalBaggedRule = "normal" | "half" | "none";

export interface SlakeLimits {
  /** Effectiveness of animal & bagged/cold blood. */
  animalAndBagged: AnimalBaggedRule;
  /** Extra Hunger each human vessel slakes *less* than normal (0, 1, or 2, 3). */
  humanPenalty: number;
  /**
   * The Hunger floor normal (non-lethal) feeding cannot drop below: only
   * draining a human to death can push Hunger under this. At low Potency this
   * is 1 (can't reach 0 without a kill); at BP 5+ it climbs to 2, then 3.
   */
  minHunger: number;
}

/**
 * Derive the feeding restrictions for a Blood Potency (0–10), matching the
 * per-level notes in lore.ts. Returns effectiveness of animal/bagged blood, the
 * per-human slake penalty, and the Hunger floor for non-lethal feeding.
 */
export function slakeLimits(bloodPotency: number): SlakeLimits {
  const bp = Math.max(0, Math.min(10, Math.floor(bloodPotency)));

  // Animal & bagged blood: normal at 0–1, half at 2, nothing at 3+.
  let animalAndBagged: AnimalBaggedRule = "normal";
  if (bp === 2) animalAndBagged = "half";
  else if (bp >= 3) animalAndBagged = "none";

  // Per-human penalty: none through BP 3; −1 at BP 4–5; −2 at BP 6–9; −3 at BP 10.
  let humanPenalty = 0;
  if (bp === 4 || bp === 5) humanPenalty = 1;
  else if (bp >= 6 && bp <= 9) humanPenalty = 2;
  else if (bp >= 10) humanPenalty = 3;

  // Hunger floor for non-lethal feeding: 1 up to BP 4 (can't hit 0 without a
  // kill), 2 at BP 5–7, 3 at BP 8+.
  let minHunger = 1;
  if (bp >= 8) minHunger = 3;
  else if (bp >= 5) minHunger = 2;

  return { animalAndBagged, humanPenalty, minHunger };
}

export interface FeedingResult {
  /** Hunger before feeding. */
  before: number;
  /** Hunger after feeding (clamped 0–5). */
  after: number;
  /** Points of Hunger actually removed. */
  slaked: number;
  /** Set when the source slakes nothing / is blocked for this Blood Potency. */
  blockedReason?: string;
}

/**
 * Compute the Hunger change for feeding on `sourceId` given an actor's current
 * Hunger and Blood Potency, without mutating anything. Applies Blood-Potency
 * restrictions (animal/bagged effectiveness, per-human penalty, minimum Hunger
 * floor) and clamps to 0–5. Killing to drain ("all") bypasses the floor and
 * reaches Hunger 0.
 */
export function computeFeeding(
  hunger: number,
  bloodPotency: number,
  sourceId: string,
): FeedingResult {
  const before = Math.max(0, Math.min(5, Math.floor(hunger)));
  const source = getFeedingSource(sourceId);
  if (!source) {
    return { before, after: before, slaked: 0, blockedReason: `Unknown feeding source "${sourceId}".` };
  }

  const limits = slakeLimits(bloodPotency);

  // Draining a human to death: slake all the way to Hunger 0.
  if (source.slake === "all") {
    return { before, after: 0, slaked: before };
  }

  // Base slake value, before Blood-Potency modifiers.
  let slake = source.slake;

  if (source.animalOrBagged) {
    if (limits.animalAndBagged === "none") {
      return {
        before,
        after: before,
        slaked: 0,
        blockedReason: "Animal and bagged blood no longer slake Hunger at this Blood Potency.",
      };
    }
    if (limits.animalAndBagged === "half") slake = Math.floor(slake / 2);
  }

  if (source.human) {
    slake = Math.max(0, slake - limits.humanPenalty);
  }

  if (slake <= 0) {
    return {
      before,
      after: before,
      slaked: 0,
      blockedReason: "This source slakes no Hunger at this Blood Potency.",
    };
  }

  // Non-lethal feeding cannot drop below the Blood-Potency floor.
  const floor = limits.minHunger;
  const after = Math.max(floor, before - slake);
  const slaked = before - after;

  if (slaked <= 0) {
    return {
      before,
      after: before,
      slaked: 0,
      blockedReason: `Non-lethal feeding cannot lower Hunger below ${floor} at this Blood Potency — drain a human to go lower.`,
    };
  }

  return { before, after, slaked };
}

/**
 * Apply feeding to an actor: computes the new Hunger via {@link computeFeeding},
 * writes it back with `actor.update`, and returns the result for the UI/chat to
 * render. If the source is blocked the actor is left unchanged.
 */
export async function applyFeeding(actor: any, sourceId: string): Promise<FeedingResult> {
  const sys = actor?.system ?? {};
  const result = computeFeeding(sys.hunger ?? 0, sys.bloodPotency ?? 0, sourceId);
  if (!result.blockedReason && result.after !== result.before) {
    await actor.update({ "system.hunger": result.after });
  }
  return result;
}
