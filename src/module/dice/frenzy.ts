/**
 * Frenzy resistance — a Willpower pool against a difficulty set by the trigger,
 * with clan-specific modifiers and a small outcome table describing which face of
 * the Beast breaks loose. Hunger dice apply, so a high-Hunger vampire is likelier
 * to lose control; a bestial failure is always a slip into frenzy.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { BLOOD_POTENCY } from "../config.ts";
import { postRollCard } from "./chat.ts";
import { rollPool } from "./roll-v5.ts";

export type FrenzyTrigger = "fury" | "terror" | "hunger";

export interface FrenzyTriggerDef {
  key: FrenzyTrigger;
  label: string;
  /** Default difficulty; the caller can override per the scene. */
  difficulty: number;
  /** What happens if the roll is lost. */
  onFail: string;
}

export const FRENZY_TRIGGERS: FrenzyTriggerDef[] = [
  { key: "fury", label: "Fury (provocation)", difficulty: 3, onFail: "fury frenzy — lash out at the provocation" },
  { key: "terror", label: "Terror (fire / sunlight)", difficulty: 4, onFail: "terror (Rötschreck) — flee the source of fear" },
  { key: "hunger", label: "Hunger (the scent of blood)", difficulty: 3, onFail: "hunger frenzy — feed, whatever the cost" },
];

function baneSeverity(bloodPotency: number): number {
  return BLOOD_POTENCY[Math.max(0, Math.min(10, bloodPotency))]?.bane ?? 2;
}

/** Willpower rating used as the resistance pool base (track max or flat number). */
function willpowerRating(actor: any): number {
  const wp = actor.system?.willpower;
  if (wp && typeof wp === "object") return wp.max ?? 0;
  return typeof wp === "number" ? wp : 0;
}

export interface FrenzyOptions {
  trigger?: FrenzyTrigger;
  difficulty?: number;
}

export async function frenzyCheck(actor: any, opts: FrenzyOptions = {}): Promise<boolean> {
  const trigger = opts.trigger ?? "fury";
  const def = FRENZY_TRIGGERS.find((t) => t.key === trigger) ?? FRENZY_TRIGGERS[0]!;
  const difficulty = opts.difficulty ?? def.difficulty;

  let pool = Math.max(1, willpowerRating(actor));
  const clan = actor.system?.clan ?? "";
  const bane = baneSeverity(actor.system?.bloodPotency ?? 0);

  // Clan-specific: the Brujah Bane subtracts Bane Severity from resisting fury.
  const notes: string[] = [];
  if (clan === "brujah" && trigger === "fury") {
    pool = Math.max(1, pool - bane);
    notes.push(`Brujah Bane: −${bane} dice to resist fury frenzy.`);
  }

  const hunger = actor.system?.hunger ?? 0;
  const { result, roll } = await rollPool({ pool, hunger, difficulty });
  const held = result.won && !result.bestial;

  notes.unshift(held ? "The Beast is held." : `Frenzy takes hold — ${def.onFail}.`);
  if (result.bestial && result.won) notes.push("A Hunger 1 undercuts the win: the Beast slips loose anyway.");

  await postRollCard(actor, result, roll, {
    flavor: `Resist Frenzy — ${def.label}`,
    note: notes.join(" "),
  });
  return held;
}

/**
 * Prompt for the provocation (which decides the Beast's face and the default
 * difficulty), then run the check. Falls back to a straight fury check if the
 * DialogV2 API is unavailable.
 */
export async function openFrenzyDialog(actor: any): Promise<void> {
  const DialogV2 = (foundry as any).applications?.api?.DialogV2;
  if (!DialogV2?.wait) {
    await frenzyCheck(actor);
    return;
  }
  const content = `
    <p style="margin:.2em 0 .6em">Choose the provocation. Difficulty defaults to the trigger — edit it for the scene.</p>
    <label style="display:flex;gap:.5em;align-items:center">Difficulty
      <input name="gl-diff" type="number" min="1" max="9" placeholder="(default)" style="width:5em"/>
    </label>`;
  const buttons = FRENZY_TRIGGERS.map((t) => ({
    action: t.key,
    label: t.label,
    callback: (_ev: any, _btn: any, dialog: any) => {
      const raw = dialog?.element?.querySelector?.("[name='gl-diff']")?.value;
      const diff = Number(raw);
      return { trigger: t.key, difficulty: Number.isFinite(diff) && diff > 0 ? diff : t.difficulty };
    },
  }));
  const res = await DialogV2.wait({
    window: { title: "Resist Frenzy" },
    content,
    buttons,
    rejectClose: false,
  });
  if (res) await frenzyCheck(actor, res as FrenzyOptions);
}
