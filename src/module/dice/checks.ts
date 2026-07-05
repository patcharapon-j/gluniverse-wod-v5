/**
 * The single-purpose V5 checks that hang off a Vampire: Rouse (feeding the
 * Blood), Remorse (clinging to Humanity) and Frenzy (holding the Beast). Each
 * rolls real Foundry dice, mutates the actor where the rules say so, and posts a
 * styled chat card.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { BLOOD_POTENCY } from "../config.ts";
import { getSetting, SETTINGS } from "../settings.ts";
import { postCheckCard, waitForDiceAnimation } from "./chat.ts";

/** One die, 6+ succeeds. Blood Potency can let low-level Rouse checks re-roll. */
export async function rouseCheck(
  actor: any,
  opts: { reroll?: boolean; label?: string } = {},
): Promise<boolean> {
  // Rouse checks roll the dedicated Rouse die (`dr`, bone-and-blood preset) so
  // they can never be confused with Hunger dice landing in the same tray.
  const roll = await new Roll(opts.reroll ? "2drkh" : "1dr").evaluate();
  const dice: number[] = roll.dice[0].results.map((r: any) => r.result);
  const best = Math.max(...dice);
  const success = best >= 6;

  const automate = getSetting(SETTINGS.automateHunger, true);
  const message = await postCheckCard(actor, {
    kind: "rouse",
    title: opts.label ?? "Rouse the Blood",
    success,
    dice,
    detail: success
      ? "The Blood answers — no Hunger gained."
      : automate
        ? "Hunger rises by 1."
        : "The Blood resists — raise Hunger by 1.",
    roll,
  });

  // Raise Hunger only after the 3D dice settle: a tracker ticking up while
  // they are still tumbling would spoil the result.
  if (!success && automate) {
    await waitForDiceAnimation(message);
    const cur = actor.system.hunger ?? 0;
    if (cur < 5) await actor.update({ "system.hunger": cur + 1 });
  }
  return success;
}

/** Whether Blood Potency allows a Rouse re-roll for a discipline of `level`. */
export function rouseRerollAllowed(bloodPotency: number, level: number): boolean {
  const bp = BLOOD_POTENCY[Math.max(0, Math.min(10, bloodPotency))];
  return !!bp && level <= bp.rouseReroll;
}

/**
 * Remorse: roll one die per empty, un-stained Humanity box (min 1). Any success
 * keeps Humanity and clears the stains; total failure drops Humanity by one.
 */
export async function remorseCheck(actor: any): Promise<boolean> {
  const humanity = actor.system.humanity?.value ?? 0;
  const stains = actor.system.humanity?.stains ?? 0;
  const pool = Math.max(1, 10 - humanity - stains);

  const roll = await new Roll(`${pool}dv`).evaluate();
  const dice: number[] = roll.dice[0].results.map((r: any) => r.result);
  const success = dice.some((d) => d >= 6);

  const automate = getSetting(SETTINGS.automateRemorse, true);
  const message = await postCheckCard(actor, {
    kind: "remorse",
    title: "Remorse",
    success,
    dice,
    detail: success
      ? automate
        ? "Remorse takes hold — stains wash away, Humanity holds."
        : "Remorse takes hold — clear the stains; Humanity holds."
      : automate
        ? "The Beast wins — Humanity falls by 1."
        : "The Beast wins — lower Humanity by 1 and clear the stains.",
    roll,
  });

  // Same spoiler guard as the Rouse check: hold the Humanity/stain changes
  // until the 3D dice have landed.
  if (automate) {
    await waitForDiceAnimation(message);
    if (success) {
      await actor.update({ "system.humanity.stains": 0 });
    } else {
      await actor.update({
        "system.humanity.value": Math.max(0, humanity - 1),
        "system.humanity.stains": 0,
      });
    }
  }
  return success;
}

/** Blood Surge: extra dice equal to the Blood Potency surge bonus (costs a Rouse). */
export function bloodSurgeBonus(bloodPotency: number): number {
  const bp = BLOOD_POTENCY[Math.max(0, Math.min(10, bloodPotency))];
  return bp?.surge ?? 1;
}
