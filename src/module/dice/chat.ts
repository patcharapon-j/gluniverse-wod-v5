/**
 * Chat-card rendering for the dice engine.
 *
 * A card is a normal Foundry chat message: it carries the real `Roll` objects
 * (so Dice So Nice animates and the dice log records them) and embeds Foundry's
 * own rendered dice breakdown in a collapsible section, so the message reads as a
 * first-class Foundry roll card while keeping the system's parchment styling for
 * the summary. Buttons are wired by a delegated listener in {@link ./chat-actions.ts}.
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
  const title = rerolled ? ' title="Willpower re-roll"' : "";
  return `<span class="${cls.join(" ")}"${title}>${value}</span>`;
}

function diceRow(result: V5RollResult): string {
  const chips = result.dice.map((d) => dieChip(d.value, d.hunger, d.rerolled)).join("");
  return `<div class="gl-dice">${chips}</div>`;
}

export interface RollCardOptions {
  actorName: string;
  img?: string;
  result: V5RollResult;
  flavor: string;
  /** Native Foundry `await roll.render()` HTML, embedded as the dice breakdown. */
  diceTooltip?: string;
  /** Show the blood-surge band + a Rouse note. */
  bloodSurge?: boolean;
  /** Extra italic note under the dice (e.g. the Willpower re-roll line). */
  note?: string;
}

/** Build the roll-card body (the message content Foundry wraps in its chrome). */
export function rollCardHTML(opts: RollCardOptions): string {
  const { result } = opts;
  const badge = OUTCOME_LABEL[result.outcome] ?? "Result";
  const critNote =
    result.critPairs > 0
      ? `<span class="gl-crit-note">+${result.bonusSuccesses} from ${result.critPairs} critical pair${result.critPairs > 1 ? "s" : ""}</span>`
      : "";
  const canReroll =
    !result.willpowerUsed && result.dice.some((d) => !d.hunger && !d.rerolled);
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

  const portrait = opts.img
    ? `<img class="gl-card-portrait" src="${esc(opts.img)}" alt="" onerror="this.style.display='none'"/>`
    : "";

  return `
  <div class="gl-card ${opts.bloodSurge ? "gl-surge" : ""}" data-outcome="${result.outcome}">
    ${opts.bloodSurge ? `<div class="gl-surge-band" aria-hidden="true"></div>` : ""}
    <div class="gl-card-head">
      ${portrait}
      <div class="gl-card-id">
        <span class="gl-card-actor">${esc(opts.actorName)}</span>
        <span class="gl-card-flavor">${esc(opts.flavor)}</span>
      </div>
    </div>

    <div class="gl-card-tally gl-out-${result.outcome}">
      <div class="gl-tally-num"><b>${result.successes}</b><span>${plural(result.successes, "success")}</span></div>
      <div class="gl-tally-badge"><span class="gl-badge">${badge}</span><span class="gl-vs">vs Difficulty ${result.difficulty}</span></div>
    </div>

    ${opts.bloodSurge ? `<div class="gl-surge-tag">Blood Surge — Rouse the Blood</div>` : ""}

    ${diceRow(result)}

    <div class="gl-card-meta">
      <span>${plural(result.rawSuccesses, "hit")}${result.bonusSuccesses ? ` + ${result.bonusSuccesses} crit` : ""}</span>
      ${critNote}
      ${result.hungerOnes > 0 ? `<span class="gl-bane-note">${plural(result.hungerOnes, "Hunger&nbsp;1")}</span>` : ""}
      ${result.messy ? `<span class="gl-bane-note">Messy</span>` : ""}
    </div>

    ${opts.note ? `<div class="gl-card-detail">${esc(opts.note)}</div>` : ""}

    ${
      opts.diceTooltip
        ? `<details class="gl-card-breakdown"><summary>Dice</summary>${opts.diceTooltip}</details>`
        : ""
    }

    ${
      canReroll
        ? `<div class="gl-card-actions">
             <button type="button" class="gl-act" data-gl-action="wp-reroll">Willpower Re-roll</button>
           </div>`
        : ""
    }
  </div>`;
}

/** Foundry's own rendered dice HTML for a Roll (the standard breakdown). */
export async function renderDiceTooltip(roll: any): Promise<string> {
  try {
    return await roll.render();
  } catch {
    return "";
  }
}

/** Post a standard pool roll as a chat message carrying the Foundry Roll (DSN). */
export async function postRollCard(
  actor: any,
  result: V5RollResult,
  roll: any,
  opts: { flavor?: string; bloodSurge?: boolean; note?: string } = {},
): Promise<void> {
  const flavor = opts.flavor ?? "Roll";
  const img = actor?.img;
  const diceTooltip = await renderDiceTooltip(roll);
  const content = rollCardHTML({
    actorName: actor?.name ?? "—",
    img,
    result,
    flavor,
    diceTooltip,
    bloodSurge: opts.bloodSurge,
    note: opts.note,
  });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [roll],
    flags: {
      [SYSTEM_ID]: {
        card: "roll",
        result,
        actorUuid: actor?.uuid,
        actorName: actor?.name,
        img,
        flavor,
        bloodSurge: !!opts.bloodSurge,
      },
    },
  });
}

export interface CheckCardData {
  kind: "rouse" | "remorse" | "frenzy";
  title: string;
  success: boolean;
  dice: number[];
  detail: string;
  roll: any;
  img?: string;
}

/** Post a single-purpose check (Rouse / Remorse / Frenzy) card. */
export async function postCheckCard(actor: any, data: CheckCardData): Promise<void> {
  const chips = data.dice.map((v) => dieChip(v, data.kind === "rouse", false)).join("");
  const diceTooltip = await renderDiceTooltip(data.roll);
  const img = data.img ?? actor?.img;
  const portrait = img
    ? `<img class="gl-card-portrait" src="${esc(img)}" alt="" onerror="this.style.display='none'"/>`
    : "";
  const content = `
  <div class="gl-card gl-check" data-outcome="${data.success ? "success" : "failure"}">
    <div class="gl-card-head">
      ${portrait}
      <div class="gl-card-id">
        <span class="gl-card-actor">${esc(actor?.name ?? "—")}</span>
        <span class="gl-card-flavor">${esc(data.title)}</span>
      </div>
    </div>
    <div class="gl-card-tally ${data.success ? "gl-out-success" : "gl-out-failure"}">
      <div class="gl-tally-badge"><span class="gl-badge">${data.success ? "Success" : "Failure"}</span></div>
    </div>
    <div class="gl-dice">${chips}</div>
    <div class="gl-card-detail">${esc(data.detail)}</div>
    ${diceTooltip ? `<details class="gl-card-breakdown"><summary>Dice</summary>${diceTooltip}</details>` : ""}
  </div>`;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [data.roll],
    flags: { [SYSTEM_ID]: { card: data.kind } },
  });
}
