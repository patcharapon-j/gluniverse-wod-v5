/**
 * Shared contract for the Storyteller roll-request feature.
 *
 * A roll request is a public, GM-authored chat card whose full state lives in
 * the message's system flags. Players fulfil it through the normal roll dialog;
 * their clients notify the active GM's client over the system socket, and that
 * GM client is the SINGLE WRITER that updates the request card (players cannot
 * update a message they do not own).
 */

import type { V5RollResult } from "./roll-v5.ts";

/** The trait-keyed pool a request asks for; dots resolve per target actor. */
export interface RequestPoolSpec {
  /** Attribute key (e.g. "wits") — see ATTRIBUTE_KEYS. */
  attribute?: string;
  /** Skill key (e.g. "awareness") — see SKILL_KEYS. */
  skill?: string;
  /** Discipline key; targets without it simply contribute 0 dots. */
  discipline?: string;
  /** Flat modifier applied on top of the trait dots. */
  modifier?: number;
}

/** Contested opposition: a real actor's pool, or an ad-hoc off-screen pool. */
export type OppositionSpec =
  | {
      type: "actor";
      actorUuid: string;
      actorName: string;
      img?: string;
      pool: RequestPoolSpec;
    }
  | {
      type: "adhoc";
      /** Display label, e.g. "The stalker". */
      label: string;
      /** Flat dice count. */
      dice: number;
      /** Hunger dice within the pool (0–5), for off-screen vampires. */
      hunger: number;
    };

/** Per-target state, updated by the GM client as results arrive. */
export interface RequestTarget {
  actorUuid: string;
  actorName: string;
  img?: string;
  rolled: boolean;
  /** Set once rolled. */
  result?: V5RollResult;
  resultMessageId?: string;
  /** Human note when the rolled pool deviates from the requested one. */
  deviation?: string;
}

/** The whole request, stored under flags[SYSTEM_ID].request on the card. */
export interface RequestState {
  /** Human flavor line, e.g. "Spot the stalker". */
  flavor: string;
  pool: RequestPoolSpec;
  mode: "static" | "contested";
  /** Static mode only. 0 = open-ended (count successes). */
  difficulty: number;
  /** Contested mode only. */
  opposition?: OppositionSpec & {
    result?: V5RollResult;
    resultMessageId?: string;
  };
  targets: RequestTarget[];
  cancelled: boolean;
}

/** Message flags shape: flags[SYSTEM_ID] = { card: "request", request: RequestState } */
export const REQUEST_CARD_KIND = "request";

/** One resolved pairing of the contest (derived, never stored). */
export interface ContestPairing {
  target: RequestTarget;
  /** target successes minus opposition successes; null until both rolled. */
  margin: number | null;
  winner: "target" | "opposition" | "tie" | null;
}

/* ------------------------------------------------------------------ socket */

export const SOCKET_NAME = "system.gluniverse-wod-v5";

/** Player → GM: a target fulfilled (or re-rolled via Willpower) its roll. */
export interface RequestFulfilledPayload {
  type: "requestFulfilled";
  /** ChatMessage id of the request card. */
  requestMessageId: string;
  actorUuid: string;
  result: V5RollResult;
  resultMessageId: string;
  /** e.g. "requested Wits + Awareness, rolled Wits + Intimidation" */
  deviation?: string;
}

export type RequestSocketPayload = RequestFulfilledPayload;

/* --------------------------------------------------- contract signatures
 *
 * Implemented in src/module/dice/request.ts:
 *
 *   createRollRequest(state: Omit<RequestState, "cancelled">): Promise<ChatMessage>
 *     — GM only. Posts the public request card with flags + rendered HTML.
 *
 *   requestCardHTML(state: RequestState, messageId?: string): string
 *     — Pure render of the card body from state (used on create and update).
 *       Buttons carry data-gl-action: "request-roll" (per target, with
 *       data-actor-uuid), "request-oppose", "request-cancel".
 *
 *   contestPairings(state: RequestState): ContestPairing[]
 *     — Pure derivation of per-target contest outcomes.
 *
 *   applyFulfillment(message: ChatMessage, payload: RequestFulfilledPayload): Promise<void>
 *     — GM client only: writes the target's result into flags and re-renders
 *       the card content via requestCardHTML.
 *
 *   routeRequestUpdate(payload: RequestSocketPayload): Promise<void>
 *     — If this client is game.users.activeGM, apply directly; otherwise emit
 *       on SOCKET_NAME. Called by the roll pipeline after posting a linked
 *       result card, and again after a Willpower re-roll.
 *
 * Implemented in src/module/socket.ts:
 *
 *   registerSystemSocket(): void
 *     — game.socket.on(SOCKET_NAME, ...); active-GM client dispatches
 *       "requestFulfilled" to applyFulfillment. Registered during "ready".
 *
 * Implemented in src/module/apps/RequestRollApp.ts:
 *
 *   openRequestRollDialog(): void
 *     — GM-only ApplicationV2 + Svelte form; on submit calls createRollRequest.
 *
 * RollSeed extensions (src/module/apps/RollDialogApp.ts):
 *
 *   requestMessageId?: string   // links the roll back to the request card
 *   lockDifficulty?: boolean    // difficulty input read-only in the dialog
 *   modifier?: number           // pre-seeded flat modifier
 *   requestedPool?: RequestPoolSpec // for computing the deviation note
 *
 * Result-card flags gain: requestMessageId?: string (set when the roll came
 * from a request), so the Willpower re-roll flow knows to re-emit.
 */
