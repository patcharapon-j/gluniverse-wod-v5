/**
 * Chat-card rendering for the dice engine. Cards are plain HTML strings injected
 * into Foundry's chat log (outside our Svelte sheet DOM), so their styling lives
 * in the global stylesheet under `.gl-card`, and their buttons are wired up by a
 * delegated listener in {@link ./chat-actions.ts}.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "../config.ts";
import type { V5RollResult } from "./roll-v5.ts";

const OUTCOME_LABEL: Record<string, string> = {
  critical: "Critical",
  messy: "Messy Critical",
  success: "Success",
  failure: "Failure",
  bestial: "Bestial Failure",
  totalFailure: "Total Failure",
};

function esc(s: string): string {
  return foundry.utils.escapeHTML?.(s) ?? String(s);
}

/** One die chip: hunger vs regular, with success / crit / bestial styling. */
function dieChip(value: number, hunger: boolean, rerolled = false): string {
  const cls = ["gl-die"];
  if (hunger) cls.push("hunger");
  if (value === 10) cls.push("crit");
  else if (value >= 6) cls.push("hit");
  else if (hunger && value === 1) cls.push("bane");
  else cls.push("miss");
  if (rerolled) cls.push("rerolled");
  return `<span class="${cls.join(" ")}">${value}</span>`;
}

function diceRow(result: V5RollResult): string {
  const chips = result.dice.map((d) => dieChip(d.value, d.hunger, d.rerolled)).join("");
  return `<div class="gl-dice">${chips}</div>`;
}

/** Build the roll-card body (no chat wrapper). */
export function rollCardHTML(
  actorName: string,
  result: V5RollResult,
  flavor: string,
  wonText?: string,
): string {
  const badge = OUTCOME_LABEL[result.outcome] ?? "Result";
  const critNote =
    result.critPairs > 0
      ? `<span class="gl-crit-note">+${result.bonusSuccesses} from ${result.critPairs} critical pair${result.critPairs > 1 ? "s" : ""}</span>`
      : "";
  const canReroll = result.dice.some((d) => !d.hunger && !d.rerolled);

  return `
  <div class="gl-card" data-outcome="${result.outcome}">
    <div class="gl-card-head">
      <span class="gl-card-actor">${esc(actorName)}</span>
      <span class="gl-card-flavor">${esc(flavor)}</span>
    </div>
    <div class="gl-card-outcome gl-out-${result.outcome}">
      <span class="gl-badge">${badge}</span>
      <span class="gl-succ"><b>${result.successes}</b> vs DC ${result.difficulty}</span>
    </div>
    ${diceRow(result)}
    <div class="gl-card-meta">
      <span>${result.rawSuccesses} hit${result.rawSuccesses === 1 ? "" : "s"}</span>
      ${critNote}
      ${result.hungerOnes > 0 ? `<span class="gl-bane-note">${result.hungerOnes} Hunger 1${result.hungerOnes > 1 ? "s" : ""}</span>` : ""}
    </div>
    ${
      canReroll
        ? `<div class="gl-card-actions">
             <button type="button" class="gl-act" data-gl-action="wp-reroll">Willpower Re-roll</button>
           </div>`
        : ""
    }
  </div>`;
}

/** Post a standard pool roll as a chat message carrying the Foundry Roll (DSN). */
export async function postRollCard(
  actor: any,
  result: V5RollResult,
  roll: any,
  opts: { flavor?: string; won?: string } = {},
): Promise<void> {
  const flavor = opts.flavor ?? "Roll";
  const content = rollCardHTML(actor?.name ?? "—", result, flavor, opts.won);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [roll],
    flags: {
      [SYSTEM_ID]: {
        card: "roll",
        result,
        actorUuid: actor?.uuid,
      },
    },
  });
}

export interface CheckCardData {
  kind: "rouse" | "remorse";
  title: string;
  success: boolean;
  dice: number[];
  detail: string;
  roll: any;
}

/** Post a single-purpose check (Rouse / Remorse) card. */
export async function postCheckCard(actor: any, data: CheckCardData): Promise<void> {
  const chips = data.dice
    .map((v) => dieChip(v, data.kind === "rouse", false))
    .join("");
  const content = `
  <div class="gl-card gl-check" data-outcome="${data.success ? "success" : "failure"}">
    <div class="gl-card-head">
      <span class="gl-card-actor">${esc(actor?.name ?? "—")}</span>
      <span class="gl-card-flavor">${esc(data.title)}</span>
    </div>
    <div class="gl-card-outcome ${data.success ? "gl-out-success" : "gl-out-failure"}">
      <span class="gl-badge">${data.success ? "Success" : "Failure"}</span>
    </div>
    <div class="gl-dice">${chips}</div>
    <div class="gl-card-detail">${esc(data.detail)}</div>
  </div>`;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [data.roll],
    flags: { [SYSTEM_ID]: { card: data.kind } },
  });
}
