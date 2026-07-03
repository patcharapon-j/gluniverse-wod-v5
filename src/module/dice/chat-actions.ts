/**
 * Delegated handlers for the buttons on our chat cards. Foundry v13+ fires
 * `renderChatMessageHTML` with a real HTMLElement; older builds fire
 * `renderChatMessage` with a jQuery wrapper. We support both.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "../config.ts";
import type { V5RollResult } from "./roll-v5.ts";
import { willpowerReroll } from "./roll-v5.ts";
import { rollCardHTML, renderDiceTooltip } from "./chat.ts";

/**
 * Spend a Willpower re-roll on an existing card: re-roll the lowest regular dice,
 * mark one Superficial Willpower on the actor, and rewrite the *same* message so
 * there is no duplicate card and no second re-roll is offered.
 */
async function onWillpowerReroll(message: any, button: HTMLElement): Promise<void> {
  const flags = message.getFlag?.(SYSTEM_ID) ?? {};
  const prev = flags.result as V5RollResult | undefined;
  if (!prev || prev.willpowerUsed) return;
  button.setAttribute("disabled", "true");

  const redo = await willpowerReroll(prev);
  if (!redo) return;

  const actorUuid = flags.actorUuid as string | undefined;
  const actor = actorUuid ? await fromUuid(actorUuid) : null;
  await markWillpowerCost(actor);

  const rerolled = redo.result.dice
    .map((d, i) => (d.rerolled ? i + 1 : 0))
    .filter(Boolean);
  const note = `Willpower re-roll — 1 Superficial Willpower spent; re-rolled ${rerolled.length} ${rerolled.length === 1 ? "die" : "dice"}.`;

  const diceTooltip = await renderDiceTooltip(redo.roll);
  const content = rollCardHTML({
    actorName: (flags.actorName as string) ?? actor?.name ?? message.alias ?? "—",
    img: flags.img as string | undefined,
    result: redo.result,
    flavor: (flags.flavor as string) ?? "Roll",
    diceTooltip,
    bloodSurge: !!flags.bloodSurge,
    note,
  });

  // Edit the original message in place; append the re-roll's dice to its rolls.
  const rolls = [...(message.rolls ?? []), redo.roll];
  await message.update({
    content,
    rolls,
    [`flags.${SYSTEM_ID}.result`]: redo.result,
  });
}

/** Mark one Superficial Willpower on a track-based actor (no-op otherwise). */
async function markWillpowerCost(actor: any): Promise<void> {
  const wp = actor?.system?.willpower;
  if (!wp || typeof wp !== "object") return;
  const max = wp.max ?? 0;
  const superficial = wp.superficial ?? 0;
  const aggravated = wp.aggravated ?? 0;
  if (superficial + aggravated >= max) return; // track already full
  await actor.update({ "system.willpower.superficial": superficial + 1 });
}

async function onAction(message: any, button: HTMLElement): Promise<void> {
  if (button.dataset.glAction === "wp-reroll") await onWillpowerReroll(message, button);
}

function bind(message: any, root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("[data-gl-action]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      onAction(message, btn);
    });
  });
}

/** Register both the modern and legacy render hooks (only one will fire). */
export function registerChatActions(): void {
  Hooks.on("renderChatMessageHTML", (message: any, html: HTMLElement) => {
    bind(message, html);
  });
  Hooks.on("renderChatMessage", (message: any, html: any) => {
    const el: HTMLElement | undefined = html?.[0] ?? html;
    if (el) bind(message, el);
  });
}
