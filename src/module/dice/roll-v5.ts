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
}

/** Pure success/critical/messy/bestial evaluation over a set of dice. */
export function evaluate(dice: DieResult[], difficulty: number): V5RollResult {
  const tens = dice.filter((d) => d.value === 10).length;
  const critPairs = Math.floor(tens / 2);
  const rawSuccesses = dice.filter((d) => d.value >= 6).length;
  const bonusSuccesses = critPairs * 2;
  const successes = rawSuccesses + bonusSuccesses;

  const hungerTens = dice.filter((d) => d.hunger && d.value === 10).length;
  const hungerOnes = dice.filter((d) => d.hunger && d.value === 1).length;

  const target = Math.max(1, difficulty);
  const won = successes >= target;
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
  const difficulty = Math.max(0, Math.floor(opts.difficulty ?? 1));

  const parts: string[] = [];
  if (normal > 0) parts.push(`${normal}d10`);
  if (hunger > 0) parts.push(`${hunger}d10`);
  const formula = parts.join(" + ") || "0d10";

  const roll = await new Roll(formula).evaluate();

  const dice: DieResult[] = [];
  roll.dice.forEach((term: any, ti: number) => {
    // With both kinds present the hunger term is index 1; if there are no normal
    // dice the single term is the hunger pool.
    const isHunger = (normal > 0 && ti === 1) || normal === 0;
    for (const r of term.results) dice.push({ value: r.result, hunger: isHunger });
  });

  return { result: evaluate(dice, difficulty), roll };
}

/**
 * Re-roll up to three non-Hunger dice (Willpower re-roll). Chooses the lowest
 * regular dice by default. Returns a fresh result and the re-roll `Roll`.
 */
export async function willpowerReroll(
  prev: V5RollResult,
): Promise<{ result: V5RollResult; roll: any } | null> {
  const regular = prev.dice
    .map((d, i) => ({ d, i }))
    .filter((x) => !x.d.hunger);
  if (regular.length === 0) return null;

  const toReroll = regular
    .sort((a, b) => a.d.value - b.d.value)
    .slice(0, 3)
    .map((x) => x.i);
  if (toReroll.length === 0) return null;

  const roll = await new Roll(`${toReroll.length}d10`).evaluate();
  const fresh: number[] = roll.dice[0].results.map((r: any) => r.result);

  const dice = prev.dice.map((d) => ({ ...d }));
  toReroll.forEach((idx, k) => {
    dice[idx] = { value: fresh[k]!, hunger: false, rerolled: true };
  });

  return { result: evaluate(dice, prev.difficulty), roll };
}
