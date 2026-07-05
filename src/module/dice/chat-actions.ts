/**
 * Delegated handlers for the buttons on our chat cards. Foundry v13+ fires
 * `renderChatMessageHTML` with a real HTMLElement; older builds fire
 * `renderChatMessage` with a jQuery wrapper. We support both.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "../config.ts";
import type { V5RollResult } from "./roll-v5.ts";
import { willpowerReroll, rollPool } from "./roll-v5.ts";
import { rollCardHTML, renderDiceTooltip, postRollCard } from "./chat.ts";
import { openRollDialog } from "../apps/RollDialogApp.ts";
import { disciplineRating } from "./pool.ts";
import type { RequestState, RequestPoolSpec } from "./request-types.ts";
import * as request from "./request.ts";

const MAX_WP_REROLL = 3;

/**
 * Message ids whose next render should play the card entrance animation.
 * Populated on message creation (all clients) and on a Willpower re-roll
 * rewrite, and consumed by the render hook — so re-renders of the chat log
 * (reload, scroll-back, popout) never replay the choreography.
 */
const pendingCardAnimations = new Set<string>();

/**
 * Enter selection mode on the card: the player clicks up to three regular dice
 * to re-roll (V5 core — Hunger dice are never eligible), then confirms. The
 * card's action row is swapped for confirm/cancel; cancel restores it. All of
 * this is local DOM state — nothing touches the message until confirm.
 */
function onWillpowerReroll(message: any, button: HTMLElement): void {
  // Whole-scope read: getFlag(scope, key) needs a key, so go via `flags` directly.
  const flags = message.flags?.[SYSTEM_ID] ?? {};
  const prev = flags.result as V5RollResult | undefined;
  if (!prev || prev.willpowerUsed) return;

  const card = button.closest<HTMLElement>(".gl-card");
  const actions = card?.querySelector<HTMLElement>(".gl-card-actions");
  if (!card || !actions) return;

  card.classList.add("gl-selecting");
  const originalActions = actions.innerHTML;
  const selected = new Set<number>();

  actions.innerHTML = `
    <button type="button" class="gl-act gl-act-confirm" disabled>Re-roll (0/${MAX_WP_REROLL})</button>
    <button type="button" class="gl-act gl-act-cancel">Cancel</button>`;
  const confirmBtn = actions.querySelector<HTMLButtonElement>(".gl-act-confirm")!;
  const cancelBtn = actions.querySelector<HTMLButtonElement>(".gl-act-cancel")!;

  const chips = [...card.querySelectorAll<HTMLElement>(".gl-die[data-die-index]")];

  const refresh = () => {
    confirmBtn.textContent = `Re-roll (${selected.size}/${MAX_WP_REROLL})`;
    confirmBtn.disabled = selected.size === 0;
  };

  const exit = () => {
    card.classList.remove("gl-selecting");
    chips.forEach((c) => {
      c.classList.remove("gl-selected");
      c.removeEventListener("click", onChip);
    });
    actions.innerHTML = originalActions;
    // The captured HTML carries the bound marker from before; clear it so the
    // restored Willpower button gets a fresh listener.
    actions
      .querySelectorAll<HTMLElement>("[data-gl-action]")
      .forEach((b) => delete b.dataset.glBound);
    bind(message, card);
  };

  function onChip(this: HTMLElement): void {
    const idx = Number(this.dataset.dieIndex);
    if (selected.has(idx)) {
      selected.delete(idx);
      this.classList.remove("gl-selected");
    } else {
      if (selected.size >= MAX_WP_REROLL) return;
      selected.add(idx);
      this.classList.add("gl-selected");
    }
    refresh();
  }

  chips.forEach((c) => c.addEventListener("click", onChip));
  cancelBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    exit();
  });
  confirmBtn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    if (selected.size === 0) return;
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    confirmBtn.textContent = "Rolling…";
    try {
      await performWillpowerReroll(message, flags, prev, [...selected]);
    } catch (err) {
      console.error(`${SYSTEM_ID} | Willpower re-roll failed`, err);
      exit();
    }
  });
}

/**
 * Execute a confirmed Willpower re-roll: re-roll the chosen dice, mark one
 * Superficial Willpower on the actor, wait for the Dice So Nice animation to
 * finish, then rewrite the *same* message so there is no duplicate card and no
 * second re-roll is offered.
 */
async function performWillpowerReroll(
  message: any,
  flags: any,
  prev: V5RollResult,
  indices: number[],
): Promise<void> {
  const redo = await willpowerReroll(prev, indices);
  if (!redo) return;

  const actorUuid = flags.actorUuid as string | undefined;
  const actor = actorUuid ? await fromUuid(actorUuid) : null;
  await markWillpowerCost(actor);

  const rerolled = redo.result.dice
    .map((d, i) => (d.rerolled ? i + 1 : 0))
    .filter(Boolean);
  const note = `Willpower re-roll — 1 Superficial Willpower spent; re-rolled ${rerolled.length} ${rerolled.length === 1 ? "die" : "dice"}.`;

  // Roll the 3D dice and hold the card update until the animation finishes.
  // DSN only auto-animates on message *creation*, so the re-roll must be shown
  // explicitly — and awaiting it keeps the result hidden until the dice land.
  const dice3d = (game as any).dice3d;
  if (dice3d) {
    try {
      await dice3d.showForRoll(redo.roll, (game as any).user, true);
    } catch (err) {
      console.warn(`${SYSTEM_ID} | Dice So Nice animation failed`, err);
    }
  }

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
  // The `dice-so-nice.skip` flag stops DSN from animating the appended roll a
  // second time (its updateChatMessage hook) — we already showed it above.
  if (message.id) pendingCardAnimations.add(message.id);
  const rolls = [...(message.rolls ?? []), redo.roll];
  await message.update({
    content,
    rolls,
    [`flags.${SYSTEM_ID}.result`]: redo.result,
    "flags.dice-so-nice.skip": true,
  });

  // If this result card was fulfilling a request, re-emit so the GM client
  // re-derives ticks/pairings from the re-rolled result.
  const requestMessageId = flags.requestMessageId as string | undefined;
  if (requestMessageId) {
    try {
      await request.routeRequestUpdate({
        type: "requestFulfilled",
        requestMessageId,
        actorUuid: flags.actorUuid as string,
        result: redo.result,
        resultMessageId: message.id,
        deviation: flags.deviation as string | undefined,
      });
    } catch (err) {
      console.error(`${SYSTEM_ID} | request re-roll re-emit failed`, err);
    }
  }
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

function onAction(message: any, button: HTMLElement): void {
  switch (button.dataset.glAction) {
    case "wp-reroll":
      onWillpowerReroll(message, button);
      break;
    case "request-roll":
      void onRequestRoll(message, button);
      break;
    case "request-oppose":
      void onRequestOppose(message, button);
      break;
    case "request-cancel":
      void onRequestCancel(message);
      break;
  }
}

/* ------------------------------------------------------- request card actions */

/** Read the RequestState off a request card's flags. */
function readRequestState(message: any): RequestState | undefined {
  const flags = message.flags?.[SYSTEM_ID];
  if (flags?.card !== "request") return undefined;
  return flags.request as RequestState | undefined;
}

const isGM = (): boolean => !!(game as any).user?.isGM;

/** A target row's "Roll" button — open the seeded, difficulty-locked dialog. */
async function onRequestRoll(message: any, button: HTMLElement): Promise<void> {
  const state = readRequestState(message);
  if (!state || state.cancelled) return;
  const uuid = button.dataset.actorUuid;
  if (!uuid) return;
  try {
    const actor: any = await fromUuid(uuid);
    if (!actor) return;
    if (!isGM() && !actor.isOwner) return; // not yours to roll
    const p: RequestPoolSpec = state.pool ?? {};
    openRollDialog(actor, {
      attribute: p.attribute,
      skill: p.skill,
      discipline: p.discipline,
      modifier: p.modifier,
      flavor: state.flavor,
      difficulty: state.mode === "static" ? state.difficulty : 0,
      lockDifficulty: true,
      requestMessageId: message.id,
      requestedPool: p,
    });
  } catch (err) {
    console.error(`${SYSTEM_ID} | request roll failed`, err);
  }
}

/** Resolve an actor-mode opposition pool from the opposing actor's sheet. */
function resolveOppositionPool(actor: any, spec: RequestPoolSpec): number {
  const sys = actor.system ?? {};
  let n = 0;
  if (spec.attribute) n += sys.attributes?.[spec.attribute]?.value ?? 0;
  if (spec.skill) n += sys.skills?.[spec.skill]?.value ?? 0;
  if (spec.discipline) n += disciplineRating(actor, spec.discipline);
  n += spec.modifier ?? 0;
  return Math.max(0, n);
}

/** The GM (or owning player) rolls the contest opposition once. */
async function onRequestOppose(message: any, button: HTMLElement): Promise<void> {
  const state = readRequestState(message);
  if (!state || state.cancelled) return;
  const opp = state.opposition;
  if (!opp) return;

  let pool = 0;
  let hunger = 0;
  let actor: any = null;
  let flavor = `Opposition — ${state.flavor}`;

  try {
    if (opp.type === "actor") {
      actor = await fromUuid(opp.actorUuid);
      if (!actor) return;
      if (!isGM() && !actor.isOwner) return; // GM-only unless you own the PC
      pool = resolveOppositionPool(actor, opp.pool);
      hunger = actor.system?.hunger ?? 0; // 0 for mortal/ghoul
      flavor = `Opposition — ${actor.name}`;
    } else {
      if (!isGM()) return; // ad-hoc opposition is GM-only
      pool = Math.max(0, opp.dice ?? 0);
      hunger = Math.min(Math.max(0, opp.hunger ?? 0), pool);
      flavor = `Opposition — ${opp.label}`;
    }

    const { result, roll } = await rollPool({ pool, hunger, difficulty: 0 });
    // Forced public: contested resolution assumes the table sees both sides.
    // Ad-hoc opposition has no actor/portrait.
    const resultMsg = await postRollCard(actor, result, roll, { flavor, forcePublic: true });

    await request.applyOppositionResult(message, result, resultMsg?.id ?? "");
  } catch (err) {
    console.error(`${SYSTEM_ID} | request opposition roll failed`, err);
  }
}

/** GM-only cancel: flip the request's cancelled flag and re-render. */
async function onRequestCancel(message: any): Promise<void> {
  if (!isGM()) return;
  try {
    await request.cancelRequest(message);
  } catch (err) {
    console.error(`${SYSTEM_ID} | request cancel failed`, err);
  }
}

/**
 * Bind-time gating of a request card's buttons per viewer. Owned/GM buttons stay
 * live; the rest are disabled with a "waiting" style, and the cancel button is
 * removed entirely for non-GMs.
 */
function gateRequestButtons(message: any, root: HTMLElement): void {
  const state = readRequestState(message);
  if (!state) return;
  const gm = isGM();

  // Per-target roll buttons: enabled for GM or the actor's owner.
  root.querySelectorAll<HTMLElement>('[data-gl-action="request-roll"]').forEach((btn) => {
    const uuid = btn.dataset.actorUuid;
    const owns = uuid ? !!(fromUuidSync(uuid) as any)?.isOwner : false;
    if (!(gm || owns)) disableWaiting(btn);
  });

  // Oppose button: GM-only unless PC-vs-PC (actor opposition the user owns).
  root.querySelectorAll<HTMLElement>('[data-gl-action="request-oppose"]').forEach((btn) => {
    const opp = state.opposition;
    const ownsOpp =
      opp?.type === "actor" && !!(fromUuidSync(opp.actorUuid) as any)?.isOwner;
    if (!(gm || ownsOpp)) disableWaiting(btn);
  });

  // Cancel button: GM-only — remove it entirely for players.
  if (!gm) {
    root
      .querySelectorAll<HTMLElement>('[data-gl-action="request-cancel"]')
      .forEach((btn) => btn.remove());
  }
}

/** Disable a button and mark it as awaiting another user. */
function disableWaiting(btn: HTMLElement): void {
  (btn as HTMLButtonElement).disabled = true;
  btn.classList.add("gl-waiting");
}

function bind(message: any, root: HTMLElement): void {
  // Play the entrance choreography once per fresh card (see the CSS in
  // gluniverse-wod.css). `root` is the .chat-message element itself.
  if (message.id && pendingCardAnimations.delete(message.id)) {
    const el = root.classList?.contains("chat-message")
      ? root
      : root.closest?.(".chat-message") ?? root;
    el.classList.add("gl-anim");
  }
  // Request cards gate their buttons per viewer before listeners are wired
  // (this may remove the cancel button for non-GMs).
  if (message.flags?.[SYSTEM_ID]?.card === "request") gateRequestButtons(message, root);
  root.querySelectorAll<HTMLElement>("[data-gl-action]").forEach((btn) => {
    // Both render hooks can fire for one message on v13; bind each button once.
    if (btn.dataset.glBound) return;
    btn.dataset.glBound = "1";
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      onAction(message, btn);
    });
  });
}

/** Register both the modern and legacy render hooks (only one will fire). */
export function registerChatActions(): void {
  // Fires on every client when a message arrives, before the chat log renders
  // it — flagging here is what lets bind() animate only genuinely new cards.
  Hooks.on("createChatMessage", (message: any) => {
    if (message?.id && message.flags?.[SYSTEM_ID]) pendingCardAnimations.add(message.id);
  });
  Hooks.on("renderChatMessageHTML", (message: any, html: HTMLElement) => {
    bind(message, html);
  });
  Hooks.on("renderChatMessage", (message: any, html: any) => {
    const el: HTMLElement | undefined = html?.[0] ?? html;
    if (el) bind(message, el);
  });
}
