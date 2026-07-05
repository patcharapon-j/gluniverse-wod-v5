/**
 * Delegated handlers for the buttons on our chat cards. Foundry v13+ fires
 * `renderChatMessageHTML` with a real HTMLElement; older builds fire
 * `renderChatMessage` with a jQuery wrapper. We support both.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "../config.ts";
import type { V5RollResult } from "./roll-v5.ts";
import { willpowerReroll, rollPool } from "./roll-v5.ts";
import {
  rollCardHTML,
  renderDiceTooltip,
  postRollCard,
  weaponDamageTotal,
  compulsionEligible,
} from "./chat.ts";
import type { WeaponRollInfo } from "./chat.ts";
import {
  GENERAL_COMPULSIONS,
  clanCompulsionInfo,
  generalCompulsion,
  type CompulsionInfo,
} from "../vtm/clans.ts";
import { openRollDialog } from "../apps/RollDialogApp.ts";
import { disciplineRating } from "./pool.ts";
import type {
  RequestState,
  RequestPoolSpec,
  ApplyDamagePayload,
} from "./request-types.ts";
import { SOCKET_NAME } from "./request-types.ts";
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
    weapon: flags.weapon as WeaponRollInfo | undefined,
    showCompulsion: compulsionEligible(actor, redo.result),
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

/* --------------------------------------------------------- damage pipeline */

function escHTML(s: string): string {
  return foundry.utils.escapeHTML?.(s) ?? String(s);
}

/**
 * "Apply Damage" on a weapon roll card: compute the V5 damage total (margin +
 * weapon rating, min 1) and route it to the user's current targets. Mitigation
 * (vampire halving, armor) happens on the applying client, which can always
 * read the target's real sheet.
 */
async function onApplyDamage(message: any, button: HTMLElement): Promise<void> {
  const flags = message.flags?.[SYSTEM_ID] ?? {};
  const result = flags.result as V5RollResult | undefined;
  const weapon = flags.weapon as WeaponRollInfo | undefined;
  if (!result || !weapon || !result.won) return;

  const targets = [...(((game as any).user?.targets ?? []) as Set<any>)];
  if (targets.length === 0) {
    (ui as any).notifications?.warn?.(
      "Target a token first, then click Apply Damage.",
    );
    return;
  }

  (button as HTMLButtonElement).disabled = true;
  try {
    const total = weaponDamageTotal(result, weapon);
    const superficial = weapon.damageType === "superficial" ? total : 0;
    const aggravated = weapon.damageType === "aggravated" ? total : 0;
    for (const token of targets) {
      const actor = token?.actor;
      if (!actor) continue;
      await routeApplyDamage({
        type: "applyDamage",
        targetActorUuid: actor.uuid,
        superficial,
        aggravated,
        sourceName: weapon.name,
        sourceMessageId: message.id,
      });
    }
  } catch (err) {
    console.error(`${SYSTEM_ID} | apply damage failed`, err);
  } finally {
    (button as HTMLButtonElement).disabled = false;
  }
}

/**
 * Route a damage payload to a client that may write the target: apply directly
 * when this user is a GM or owns the actor; otherwise emit for the active-GM
 * client (same single-writer pattern as request fulfilment).
 */
export async function routeApplyDamage(payload: ApplyDamagePayload): Promise<void> {
  // A player without permission gets null from fromUuid — that's the emit path.
  const actor: any = await fromUuid(payload.targetActorUuid).catch(() => null);
  if (actor && (isGM() || actor.isOwner)) {
    await applyDamageToActor(actor, payload);
    return;
  }
  if (!(game as any).users?.activeGM) {
    (ui as any).notifications?.warn?.(
      "No active Storyteller online to apply damage to that target.",
    );
    return;
  }
  (game as any).socket?.emit(SOCKET_NAME, payload);
}

/**
 * Apply raw incoming damage to an actor per V5:
 * - Vampires (and Hunger-bearing SPCs) halve superficial damage, rounding up.
 * - Equipped armor then reduces superficial damage by its rating (aggravated
 *   damage is NOT reduced by armor in this simple pass).
 * - Superficial fills empty boxes; once the track is full, further superficial
 *   converts existing superficial boxes to aggravated one-for-one.
 * Posts a public chat note describing what landed.
 */
export async function applyDamageToActor(
  actor: any,
  dmg: { superficial: number; aggravated: number; sourceName?: string },
): Promise<void> {
  const mitigation: string[] = [];
  let superficial = Math.max(0, Math.floor(dmg.superficial ?? 0));
  const aggravated = Math.max(0, Math.floor(dmg.aggravated ?? 0));

  // V5: vampires halve superficial damage from most sources, rounding up.
  // SPCs with a Hunger rating are treated as vampire-like.
  const vampiric =
    actor.type === "vampire" ||
    (actor.type === "spc" && (actor.system?.hunger ?? 0) > 0);
  if (vampiric && superficial > 0) {
    const before = superficial;
    superficial = Math.ceil(superficial / 2);
    mitigation.push(`halved from ${before}`);
  }

  const armor = actor.items?.find?.(
    (i: any) => i.type === "armor" && i.system?.equipped,
  );
  const rating = Math.max(0, armor?.system?.rating ?? 0);
  if (rating > 0 && superficial > 0) {
    const absorbed = Math.min(rating, superficial);
    superficial -= absorbed;
    mitigation.push(`armor ${absorbed}`);
  }

  const notes: string[] = [];
  const health = actor.system?.health;

  if (typeof health === "number") {
    // SPCs track health as a flat pool of boxes; no superficial/aggravated
    // split, so just knock boxes off.
    const next = Math.max(0, health - superficial - aggravated);
    await actor.update({ "system.health": next });
    if (next === 0) notes.push("Torpor/death threshold reached.");
  } else if (health && typeof health === "object") {
    const max = Math.max(0, health.max ?? 0);
    let agg = Math.min(Math.max(0, health.aggravated ?? 0), max);
    let sup = Math.min(Math.max(0, health.superficial ?? 0), max - agg);

    // Aggravated fills the track directly (displacing superficial if full).
    agg = Math.min(max, agg + aggravated);
    sup = Math.min(sup, max - agg);

    // Superficial fills empty boxes; overflow converts superficial one-for-one.
    const fill = Math.min(superficial, max - agg - sup);
    sup += fill;
    const convert = Math.min(superficial - fill, sup);
    sup -= convert;
    agg = Math.min(max, agg + convert);

    await actor.update({
      "system.health.superficial": sup,
      "system.health.aggravated": agg,
    });
    if (max > 0 && agg >= max) notes.push("Torpor/death threshold reached.");
  } else {
    return; // no health track (e.g. coterie) — nothing to apply
  }

  const parts: string[] = [];
  if (superficial > 0) parts.push(`${superficial} superficial`);
  if (aggravated > 0) parts.push(`${aggravated} aggravated`);
  const amount = parts.length ? `${parts.join(" and ")} damage` : "no damage";
  const mit = mitigation.length ? ` (${mitigation.join(", ")})` : "";
  const from = dmg.sourceName ? ` — ${escHTML(dmg.sourceName)}` : "";
  const extra = notes.length
    ? `<div class="gl-dmg-threshold">${notes.map(escHTML).join(" ")}</div>`
    : "";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="gl-card gl-damage-note">
      <span class="gl-dmg-line">${escHTML(actor.name ?? "—")} takes ${amount}${escHTML(mit)}${from}</span>
      ${extra}
    </div>`,
    flags: { [SYSTEM_ID]: { card: "damage" } },
  });
}

function onAction(message: any, button: HTMLElement): void {
  switch (button.dataset.glAction) {
    case "wp-reroll":
      onWillpowerReroll(message, button);
      break;
    case "apply-damage":
      void onApplyDamage(message, button);
      break;
    case "compulsion":
      void onCompulsion(message);
      break;
    case "compulsion-pick":
      void onCompulsionPick(message, button);
      break;
    case "compulsion-resolve":
      void onCompulsionResolve(message);
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

/* ----------------------------------------------------------- compulsion flow */

const COMPULSION_STATUS = "compulsion";

/**
 * Compulsion state stored on a compulsion chat card's flags: the actor it
 * targets, and once picked, the chosen Compulsion.
 */
interface CompulsionCardFlags {
  card: "compulsion";
  actorUuid: string;
  actorName: string;
  img?: string;
  clan?: string;
  chosen?: CompulsionInfo;
}

/** Compulsion choices for an actor: the four general ones plus its clan's. */
function compulsionOptions(clan: string | undefined): CompulsionInfo[] {
  const list = [...GENERAL_COMPULSIONS];
  const clanOne = clan ? clanCompulsionInfo(clan) : undefined;
  if (clanOne) list.push(clanOne);
  return list;
}

/** Whether the current user may act on a compulsion card (owner or GM). */
function canManageCompulsion(actor: any): boolean {
  return isGM() || !!actor?.isOwner;
}

/** Build the option-selection body of a compulsion card. */
function compulsionSelectHTML(f: CompulsionCardFlags): string {
  const portrait = f.img
    ? `<img class="gl-card-portrait" src="${escHTML(f.img)}" alt="" onerror="this.style.display='none'"/>`
    : "";
  const options = compulsionOptions(f.clan)
    .map(
      (c) => `
      <button type="button" class="gl-act gl-compulsion-opt" data-gl-action="compulsion-pick"
        data-compulsion-id="${escHTML(c.id)}">
        <span class="gl-compulsion-name">${escHTML(c.name)}</span>
        <span class="gl-compulsion-sum">${escHTML(c.summary)}</span>
      </button>`,
    )
    .join("");
  return `
  <div class="gl-card gl-compulsion" data-outcome="bestial">
    <div class="gl-card-head">
      ${portrait}
      <div class="gl-card-id">
        <span class="gl-card-actor">${escHTML(f.actorName)}</span>
        <span class="gl-card-flavor">Compulsion</span>
      </div>
    </div>
    <div class="gl-card-detail">The Beast stirs — choose a Compulsion to impose.</div>
    <div class="gl-compulsion-opts">${options}</div>
  </div>`;
}

/** Build the resolved body of a compulsion card (chosen Compulsion + resolve). */
function compulsionChosenHTML(f: CompulsionCardFlags): string {
  const c = f.chosen!;
  const portrait = f.img
    ? `<img class="gl-card-portrait" src="${escHTML(f.img)}" alt="" onerror="this.style.display='none'"/>`
    : "";
  return `
  <div class="gl-card gl-compulsion gl-compulsion-active" data-outcome="bestial">
    <div class="gl-card-head">
      ${portrait}
      <div class="gl-card-id">
        <span class="gl-card-actor">${escHTML(f.actorName)}</span>
        <span class="gl-card-flavor">Compulsion — ${escHTML(c.name)}</span>
      </div>
    </div>
    <div class="gl-compulsion-body">
      <span class="gl-compulsion-name">${escHTML(c.name)}</span>
      <span class="gl-compulsion-sum">${escHTML(c.summary)}</span>
    </div>
    <div class="gl-card-actions">
      <button type="button" class="gl-act" data-gl-action="compulsion-resolve">Resolve Compulsion</button>
    </div>
  </div>`;
}

/** Build the cleared body of a compulsion card (after Resolve). */
function compulsionResolvedHTML(f: CompulsionCardFlags): string {
  const c = f.chosen;
  const portrait = f.img
    ? `<img class="gl-card-portrait" src="${escHTML(f.img)}" alt="" onerror="this.style.display='none'"/>`
    : "";
  return `
  <div class="gl-card gl-compulsion gl-compulsion-done" data-outcome="success">
    <div class="gl-card-head">
      ${portrait}
      <div class="gl-card-id">
        <span class="gl-card-actor">${escHTML(f.actorName)}</span>
        <span class="gl-card-flavor">Compulsion — ${escHTML(c?.name ?? "")}</span>
      </div>
    </div>
    <div class="gl-card-detail">Compulsion satisfied — the Beast is quieted.</div>
  </div>`;
}

/** "Compulsion…" on a roll card: post a public compulsion-selection card. */
async function onCompulsion(message: any): Promise<void> {
  const flags = message.flags?.[SYSTEM_ID] ?? {};
  const actorUuid = flags.actorUuid as string | undefined;
  if (!actorUuid) return;
  const actor: any = await fromUuid(actorUuid).catch(() => null);
  if (!actor) return;
  if (!canManageCompulsion(actor)) return;
  if (actor.type !== "vampire") return;

  const cardFlags: CompulsionCardFlags = {
    card: "compulsion",
    actorUuid,
    actorName: actor.name ?? "—",
    img: actor.img,
    clan: actor.system?.clan as string | undefined,
  };
  try {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: compulsionSelectHTML(cardFlags),
      flags: { [SYSTEM_ID]: cardFlags },
    });
  } catch (err) {
    console.error(`${SYSTEM_ID} | post compulsion card failed`, err);
  }
}

/** Read a compulsion card's flags. */
function readCompulsionFlags(message: any): CompulsionCardFlags | undefined {
  const flags = message.flags?.[SYSTEM_ID];
  if (flags?.card !== "compulsion") return undefined;
  return flags as CompulsionCardFlags;
}

/**
 * An owner/GM picks a Compulsion: resolve its data, apply the status + actor
 * flag, and rewrite the card to show the chosen Compulsion with a Resolve
 * affordance.
 */
async function onCompulsionPick(message: any, button: HTMLElement): Promise<void> {
  const f = readCompulsionFlags(message);
  if (!f || f.chosen) return;
  const actor: any = await fromUuid(f.actorUuid).catch(() => null);
  if (!actor || !canManageCompulsion(actor)) return;

  const id = button.dataset.compulsionId;
  if (!id) return;
  const chosen = id.startsWith("clan:")
    ? clanCompulsionInfo(id.slice("clan:".length))
    : generalCompulsion(id);
  if (!chosen) return;

  try {
    await applyCompulsion(actor, chosen);
    const next: CompulsionCardFlags = { ...f, chosen };
    await message.update({
      content: compulsionChosenHTML(next),
      [`flags.${SYSTEM_ID}.chosen`]: chosen,
    });
  } catch (err) {
    console.error(`${SYSTEM_ID} | apply compulsion failed`, err);
  }
}

/** Resolve a compulsion: clear the status + flag and mark the card done. */
async function onCompulsionResolve(message: any): Promise<void> {
  const f = readCompulsionFlags(message);
  if (!f) return;
  const actor: any = await fromUuid(f.actorUuid).catch(() => null);
  if (!actor || !canManageCompulsion(actor)) return;

  try {
    await clearCompulsion(actor);
    await message.update({ content: compulsionResolvedHTML(f) });
  } catch (err) {
    console.error(`${SYSTEM_ID} | resolve compulsion failed`, err);
  }
}

/**
 * Apply a Compulsion to an actor: set the `compulsion` status effect on its
 * token/prototype and store the chosen Compulsion in a system flag. Uses the
 * v13 `Actor#toggleStatusEffect` API (not in the shim — cast to `any`).
 */
async function applyCompulsion(actor: any, chosen: CompulsionInfo): Promise<void> {
  await actor.setFlag(SYSTEM_ID, "compulsion", chosen);
  try {
    if (typeof actor.toggleStatusEffect === "function") {
      await actor.toggleStatusEffect(COMPULSION_STATUS, { active: true });
    }
  } catch (err) {
    console.warn(`${SYSTEM_ID} | could not set compulsion status`, err);
  }
}

/** Remove the Compulsion status effect and flag from an actor. */
async function clearCompulsion(actor: any): Promise<void> {
  try {
    if (typeof actor.toggleStatusEffect === "function") {
      await actor.toggleStatusEffect(COMPULSION_STATUS, { active: false });
    }
  } catch (err) {
    console.warn(`${SYSTEM_ID} | could not clear compulsion status`, err);
  }
  await actor.unsetFlag(SYSTEM_ID, "compulsion");
}

/**
 * Bind-time gating for a compulsion card: option / resolve buttons are live only
 * for the actor's owner or the GM; everyone else sees them disabled.
 */
function gateCompulsionButtons(message: any, root: HTMLElement): void {
  const f = readCompulsionFlags(message);
  if (!f) return;
  const actor = fromUuidSync(f.actorUuid) as any;
  if (canManageCompulsion(actor)) return;
  root
    .querySelectorAll<HTMLElement>(
      '[data-gl-action="compulsion-pick"], [data-gl-action="compulsion-resolve"]',
    )
    .forEach((btn) => disableWaiting(btn));
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
  if (message.flags?.[SYSTEM_ID]?.card === "compulsion") gateCompulsionButtons(message, root);
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
