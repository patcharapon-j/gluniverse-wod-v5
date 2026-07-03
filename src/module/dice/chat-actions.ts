/**
 * Delegated handlers for the buttons on our chat cards. Foundry v13+ fires
 * `renderChatMessageHTML` with a real HTMLElement; older builds fire
 * `renderChatMessage` with a jQuery wrapper. We support both.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "../config.ts";
import type { V5RollResult } from "./roll-v5.ts";
import { willpowerReroll } from "./roll-v5.ts";
import { rollCardHTML } from "./chat.ts";

async function onAction(message: any, button: HTMLElement): Promise<void> {
  const action = button.dataset.glAction;
  if (action !== "wp-reroll") return;

  const flag = message.getFlag?.(SYSTEM_ID, "result") as V5RollResult | undefined;
  if (!flag) return;
  button.setAttribute("disabled", "true");

  const redo = await willpowerReroll(flag);
  if (!redo) return;

  const actorUuid = message.getFlag(SYSTEM_ID, "actorUuid") as string | undefined;
  const actor = actorUuid ? await fromUuid(actorUuid) : null;
  const name = actor?.name ?? message.alias ?? "—";
  const content = rollCardHTML(name, redo.result, "Willpower Re-roll");

  await ChatMessage.create({
    speaker: message.speaker,
    content,
    rolls: [redo.roll],
    flags: {
      [SYSTEM_ID]: { card: "roll", result: redo.result, actorUuid, rerollOf: message.id },
    },
  });
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
