/**
 * Storyteller roll-request card: build, render, update.
 *
 * A request is a PUBLIC, GM-authored chat message whose whole state lives in its
 * system flags ({@link REQUEST_CARD_KIND}). Players fulfil it through the normal
 * roll dialog; their client routes a "requestFulfilled" payload to the single
 * active-GM writer, which folds the result back into the card here. Every render
 * path funnels through {@link requestCardHTML} so create and update stay in sync.
 *
 * This module is pure-render + GM-side mutation; button *permission* gating lives
 * in chat-actions.ts, not here — we render every button and let the binder decide
 * who may click.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "../config.ts";
import { label } from "../components/labels.ts";
import type {
  RequestState,
  RequestPoolSpec,
  RequestTarget,
  ContestPairing,
  RequestFulfilledPayload,
} from "./request-types.ts";
import { REQUEST_CARD_KIND, SOCKET_NAME } from "./request-types.ts";

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

function isGM(): boolean {
  return !!(game as any).user?.isGM;
}

/** "Wits + Awareness + Auspex + 2" from a trait-keyed pool spec. */
function poolDescription(pool: RequestPoolSpec): string {
  const parts: string[] = [];
  if (pool.attribute) parts.push(label("Attributes", pool.attribute));
  if (pool.skill) parts.push(label("Skills", pool.skill));
  if (pool.discipline) parts.push(label("Disciplines", pool.discipline));
  let desc = parts.join(" + ");
  const mod = pool.modifier ?? 0;
  if (mod !== 0) desc += `${desc ? " " : ""}${mod > 0 ? "+" : "−"} ${Math.abs(mod)}`;
  return desc || "—";
}

/** Portrait img or, when missing (ad-hoc opposition), a die-glyph placeholder. */
function portraitOrGlyph(img?: string): string {
  if (img) {
    return `<img class="gl-req-portrait" src="${esc(img)}" alt="" onerror="this.style.display='none'"/>`;
  }
  return `<span class="gl-req-glyph" aria-hidden="true">⚄</span>`;
}

/** Successes + outcome badge summary for a landed result. */
function resultSummary(result: any, deviation?: string): string {
  const n = result?.successes ?? 0;
  const badge = OUTCOME_LABEL[result?.outcome] ?? "Result";
  const dev = deviation
    ? `<span class="gl-req-deviation">${esc(deviation)}</span>`
    : "";
  return `<span class="gl-req-result gl-out-${esc(String(result?.outcome ?? ""))}">
      <b>${n}</b> <span>${n === 1 ? "success" : "successes"}</span>
      <span class="gl-badge">${esc(badge)}</span>
    </span>${dev}`;
}

/* --------------------------------------------------------------- pure render */

/**
 * Pure render of the request card body from state. Every mutation re-renders
 * through here. Buttons carry data-gl-action; chat-actions.ts wires + gates them.
 */
export function requestCardHTML(state: RequestState): string {
  const cancelled = !!state.cancelled;

  // --- header ---------------------------------------------------------------
  let vsLine = "";
  if (state.mode === "static") {
    vsLine =
      state.difficulty > 0
        ? `<span class="gl-vs">vs Difficulty ${state.difficulty}</span>`
        : `<span class="gl-vs">count successes</span>`;
  }
  const header = `
    <div class="gl-card-head">
      <div class="gl-card-id">
        <span class="gl-card-actor">Storyteller Request</span>
        <span class="gl-card-flavor">${esc(state.flavor)}</span>
      </div>
    </div>
    <div class="gl-req-pool">
      <span class="gl-req-pool-desc">${esc(poolDescription(state.pool))}</span>
      ${vsLine}
    </div>`;

  // --- contested opposition row --------------------------------------------
  let oppositionRow = "";
  if (state.mode === "contested" && state.opposition) {
    const opp = state.opposition;
    const oImg = opp.type === "actor" ? opp.img : undefined;
    const oName = opp.type === "actor" ? opp.actorName : opp.label;
    const oDesc =
      opp.type === "actor"
        ? poolDescription(opp.pool)
        : `${opp.dice} dice (${opp.hunger} hunger)`;

    let oppAction: string;
    if (opp.result === undefined) {
      oppAction = cancelled
        ? ""
        : `<button type="button" class="gl-act" data-gl-action="request-oppose">Roll Opposition</button>`;
    } else {
      oppAction = resultSummary(opp.result);
    }

    oppositionRow = `
    <div class="gl-req-oppo">
      ${portraitOrGlyph(oImg)}
      <div class="gl-req-oppo-id">
        <span class="gl-req-oppo-name">${esc(oName)}</span>
        <span class="gl-req-oppo-desc">${esc(oDesc)}</span>
      </div>
      <div class="gl-req-oppo-action">${oppAction}</div>
    </div>`;
  }

  // --- target rows ----------------------------------------------------------
  const targetRows = state.targets
    .map((t) => {
      let action: string;
      if (!t.rolled && !cancelled) {
        action = `<button type="button" class="gl-act" data-gl-action="request-roll" data-actor-uuid="${esc(t.actorUuid)}">Roll</button>`;
      } else if (t.rolled && t.result) {
        action = resultSummary(t.result, t.deviation);
      } else {
        action = "";
      }
      return `
      <div class="gl-req-target">
        ${portraitOrGlyph(t.img)}
        <span class="gl-req-name">${esc(t.actorName)}</span>
        <div class="gl-req-target-action">${action}</div>
      </div>`;
    })
    .join("");

  // --- contested resolution block ------------------------------------------
  let resolution = "";
  if (state.mode === "contested") {
    const lines = contestPairings(state)
      .filter((p) => p.margin !== null)
      .map((p) => {
        const oppName =
          state.opposition?.type === "actor"
            ? state.opposition.actorName
            : state.opposition?.type === "adhoc"
              ? state.opposition.label
              : "Opposition";
        const tSucc = p.target.result?.successes ?? 0;
        const oSucc = state.opposition?.result?.successes ?? 0;
        if (p.winner === "tie") {
          return `<div class="gl-req-res-line">vs ${esc(oppName)}: Tie (${tSucc} vs ${oSucc})</div>`;
        }
        const winnerName =
          p.winner === "target" ? p.target.actorName : oppName;
        // Margin 0 with a winner = a tie handed to the defender (V5 core).
        const tieNote = p.margin === 0 ? " (tie — defender)" : "";
        return `<div class="gl-req-res-line">vs ${esc(oppName)}: ${esc(winnerName)} wins by ${Math.abs(p.margin as number)}${tieNote}</div>`;
      })
      .join("");
    if (lines) resolution = `<div class="gl-req-resolution">${lines}</div>`;
  }

  // --- GM actions row -------------------------------------------------------
  const actions = cancelled
    ? ""
    : `<div class="gl-card-actions">
        <button type="button" class="gl-act" data-gl-action="request-cancel">Cancel</button>
      </div>`;

  const ribbon = cancelled
    ? `<div class="gl-req-ribbon">Cancelled</div>`
    : "";

  return `
  <div class="gl-card gl-req${cancelled ? " gl-cancelled" : ""}">
    ${ribbon}
    ${header}
    ${oppositionRow}
    <div class="gl-req-targets">${targetRows}</div>
    ${resolution}
    ${actions}
  </div>`;
}

/* ------------------------------------------------------------ pure derivation */

/**
 * Per-target contest outcomes. margin/winner stay null until BOTH that target
 * and the opposition have landed a result. margin = target − opposition.
 *
 * Equal successes resolve by the request's tieBreak: V5 gives ties to the
 * defender/resister, so the default (and the behaviour of old messages that
 * predate the field) hands them to the opposition; "none" keeps a neutral tie.
 */
export function contestPairings(state: RequestState): ContestPairing[] {
  const oppResult = state.opposition?.result;
  const tieBreak = state.tieBreak ?? "opposition";
  return state.targets.map((target) => {
    if (!target.result || !oppResult) {
      return { target, margin: null, winner: null };
    }
    const margin = target.result.successes - oppResult.successes;
    let winner: ContestPairing["winner"];
    if (margin > 0) winner = "target";
    else if (margin < 0) winner = "opposition";
    else winner = tieBreak === "none" ? "tie" : tieBreak;
    return { target, margin, winner };
  });
}

/* ------------------------------------------------------------- GM mutations */

/**
 * GM only: post the public request card with flags + rendered HTML. Non-GMs get
 * a warning and nothing else.
 */
export async function createRollRequest(
  state: Omit<RequestState, "cancelled">,
): Promise<any> {
  if (!isGM()) {
    (ui as any).notifications?.warn?.("Only the Storyteller can request rolls.");
    return null;
  }
  // New requests default ties to the defender (the opposition) per V5 core.
  const full: RequestState = { tieBreak: "opposition", ...state, cancelled: false };
  return ChatMessage.create({
    // Public: no whisper. Authored by the GM.
    user: (game as any).user?.id,
    speaker: { alias: "Storyteller" },
    content: requestCardHTML(full),
    flags: {
      [SYSTEM_ID]: {
        card: REQUEST_CARD_KIND,
        request: full,
      },
    },
  });
}

/**
 * Sentinel actorUuid used to route the contest opposition's result through the
 * same fulfilment payload as target results (it has no target slot of its own).
 */
export const OPPOSITION_UUID = "__opposition__";

/**
 * GM client only: write a landed result into the request flags and re-render
 * the card. `OPPOSITION_UUID` writes the opposition slot; anything else writes
 * its target row. Idempotent-safe — a Willpower re-roll re-emits with the same
 * resultMessageId and simply overwrites the stored result.
 */
export async function applyFulfillment(
  message: any,
  payload: RequestFulfilledPayload,
): Promise<void> {
  if (!message) return;
  const current: RequestState | undefined =
    message.flags?.[SYSTEM_ID]?.request;
  if (!current) return;

  // Deep-ish clone so we never mutate the live flag object in place.
  const next: RequestState = foundry.utils.deepClone(current);

  if (payload.actorUuid === OPPOSITION_UUID) {
    if (!next.opposition) return;
    next.opposition.result = payload.result;
    next.opposition.resultMessageId = payload.resultMessageId;
  } else {
    const target = next.targets.find((t) => t.actorUuid === payload.actorUuid);
    if (!target) return;
    target.rolled = true;
    target.result = payload.result;
    target.resultMessageId = payload.resultMessageId;
    target.deviation = payload.deviation;
  }

  await message.update({
    content: requestCardHTML(next),
    [`flags.${SYSTEM_ID}.request`]: next,
  });
}

/**
 * Persist the opposition roll: a GM client writes the card directly; a player
 * who rolled a PC opposition cannot update the GM's message, so their client
 * emits the sentinel fulfilment payload for the active-GM writer instead.
 */
export async function applyOppositionResult(
  message: any,
  result: RequestFulfilledPayload["result"],
  resultMessageId: string,
): Promise<void> {
  const payload: RequestFulfilledPayload = {
    type: "requestFulfilled",
    requestMessageId: message.id,
    actorUuid: OPPOSITION_UUID,
    result,
    resultMessageId,
  };
  if (isGM()) {
    await applyFulfillment(message, payload);
    return;
  }
  (game as any).socket?.emit(SOCKET_NAME, payload);
}

/** GM only: flip cancelled and re-render (strike-through, no buttons). */
export async function cancelRequest(message: any): Promise<void> {
  if (!isGM() || !message) return;
  const current: RequestState | undefined =
    message.flags?.[SYSTEM_ID]?.request;
  if (!current) return;
  const next: RequestState = { ...foundry.utils.deepClone(current), cancelled: true };
  await message.update({
    content: requestCardHTML(next),
    [`flags.${SYSTEM_ID}.request`]: next,
  });
}

/**
 * Route a fulfillment update to the single writer. If this client is the active
 * GM, apply it directly; otherwise emit it on the system socket for the GM
 * client to pick up.
 */
export async function routeRequestUpdate(
  payload: RequestFulfilledPayload,
): Promise<void> {
  const activeGmId = (game as any).users?.activeGM?.id;
  const myId = (game as any).user?.id;
  if (activeGmId && activeGmId === myId) {
    const message = (game as any).messages?.get(payload.requestMessageId);
    await applyFulfillment(message, payload);
    return;
  }
  (game as any).socket?.emit(SOCKET_NAME, payload);
}
