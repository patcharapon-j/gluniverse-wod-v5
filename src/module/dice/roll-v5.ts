/**
 * Vampire: The Masquerade V5 dice engine.
 *
 * A pool of d10s where up to `hunger` dice are Hunger dice. A die of 6+ is a
 * success; each pair of 10s adds two bonus successes (a critical). A critical
 * that includes a Hunger 10 is *messy*; a failed roll with a Hunger 1 is a
 * *bestial failure*. This module is deliberately Foundry-light: {@link evaluate}
 * is pure, and {@link rollPool} wraps it around a real Foundry `Roll` so Dice So
 * Nice and the dice log work.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type V5Outcome =
  | "critical"
  | "messy"
  | "success"
  | "failure"
  | "bestial"
  | "totalFailure";

export interface DieResult {
  value: number;
  hunger: boolean;
  /** Marked when a die was replaced by a Willpower re-roll. */
  rerolled?: boolean;
}

export interface V5RollResult {
  dice: DieResult[];
  pool: number;
  hunger: number;
  difficulty: number;
  rawSuccesses: number;
  critPairs: number;
  bonusSuccesses: number;
  successes: number;
  margin: number;
  tens: number;
  hungerTens: number;
  hungerOnes: number;
  won: boolean;
  messy: boolean;
  bestial: boolean;
  outcome: V5Outcome;
  /** True once a Willpower re-roll has been spent on this roll. */
  willpowerUsed?: boolean;
}

/**
 * Pure success/critical/messy/bestial evaluation over a set of dice.
 *
 * A `difficulty` of 0 means "no difficulty set" (the Storyteller judges the
 * total afterwards): the card just tallies successes, a crit with a Hunger 10
 * is still a Messy Critical, and any rolled Hunger 1 flags a *potential*
 * Bestial Failure — outright bestial only at zero successes, which fails at
 * any difficulty.
 */
export function evaluate(dice: DieResult[], difficulty: number): V5RollResult {
  const tens = dice.filter((d) => d.value === 10).length;
  const critPairs = Math.floor(tens / 2);
  const rawSuccesses = dice.filter((d) => d.value >= 6).length;
  const bonusSuccesses = critPairs * 2;
  const successes = rawSuccesses + bonusSuccesses;

  const hungerTens = dice.filter((d) => d.hunger && d.value === 10).length;
  const hungerOnes = dice.filter((d) => d.hunger && d.value === 1).length;

  const openEnded = difficulty <= 0;
  const won = openEnded ? successes > 0 : successes >= difficulty;
  const isCrit = critPairs >= 1;
  const messy = won && isCrit && hungerTens >= 1;
  const bestial = !won && hungerOnes >= 1;

  let outcome: V5Outcome;
  if (won) {
    outcome = isCrit ? (messy ? "messy" : "critical") : "success";
  } else if (bestial) {
    outcome = "bestial";
  } else {
    outcome = successes === 0 ? "totalFailure" : "failure";
  }

  const pool = dice.length;
  const hunger = dice.filter((d) => d.hunger).length;
  return {
    dice,
    pool,
    hunger,
    difficulty,
    rawSuccesses,
    critPairs,
    bonusSuccesses,
    successes,
    margin: successes - difficulty,
    tens,
    hungerTens,
    hungerOnes,
    won,
    messy,
    bestial,
    outcome,
  };
}

export interface RollPoolOptions {
  pool: number;
  hunger?: number;
  difficulty?: number;
}

/**
 * Roll `pool` d10s, `hunger` of them as Hunger dice, and evaluate. Returns the
 * evaluated result plus the underlying Foundry `Roll` (already evaluated) so the
 * caller can pass it to a ChatMessage for the 3D dice animation.
 */
export async function rollPool(
  opts: RollPoolOptions,
): Promise<{ result: V5RollResult; roll: any }> {
  const pool = Math.max(0, Math.floor(opts.pool));
  const hunger = Math.min(Math.max(0, Math.floor(opts.hunger ?? 0)), pool);
  const normal = pool - hunger;
  // Default is 0: no set difficulty — the card just reports successes.
  const difficulty = Math.max(0, Math.floor(opts.difficulty ?? 0));

  const parts: string[] = [];
  if (normal > 0) parts.push(`${normal}dv`);
  if (hunger > 0) parts.push(`${hunger}dh`);
  const formula = parts.join(" + ") || "0dv";

  const roll = await new Roll(formula).evaluate();

  const dice: DieResult[] = [];
  roll.dice.forEach((term: any) => {
    // The denomination is the die's identity: `dh` terms are Hunger dice.
    const isHunger = term.constructor?.DENOMINATION === "h";
    if (isHunger) {
      term.options = term.options ?? {};
      term.options.flavor = "Hunger";
    }
    for (const r of term.results) dice.push({ value: r.result, hunger: isHunger });
  });

  return { result: evaluate(dice, difficulty), roll };
}

/**
 * Re-roll up to three non-Hunger dice (Willpower re-roll). `indices` picks the
 * dice explicitly (positions in `prev.dice`; Hunger dice and out-of-range
 * entries are ignored, capped at three); without it the lowest regular dice
 * are chosen. Returns a fresh result and the re-roll `Roll`.
 */
export async function willpowerReroll(
  prev: V5RollResult,
  indices?: number[],
): Promise<{ result: V5RollResult; roll: any } | null> {
  const regular = prev.dice
    .map((d, i) => ({ d, i }))
    .filter((x) => !x.d.hunger);
  if (regular.length === 0) return null;

  const eligible = new Set(regular.map((x) => x.i));
  const toReroll = indices?.length
    ? [...new Set(indices)].filter((i) => eligible.has(i)).slice(0, 3)
    : regular
        .sort((a, b) => a.d.value - b.d.value)
        .slice(0, 3)
        .map((x) => x.i);
  if (toReroll.length === 0) return null;

  // A `dv` roll picks up the system's Dice So Nice preset by type.
  const roll = await new Roll(`${toReroll.length}dv`).evaluate();
  const fresh: number[] = roll.dice[0].results.map((r: any) => r.result);

  const dice = prev.dice.map((d) => ({ ...d }));
  toReroll.forEach((idx, k) => {
    dice[idx] = { value: fresh[k]!, hunger: false, rerolled: true };
  });

  const result = evaluate(dice, prev.difficulty);
  result.willpowerUsed = true;
  return { result, roll };
}
