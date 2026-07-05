/**
 * System socket — the roll-request feature's only cross-client channel.
 *
 * A player's client cannot update the GM-authored request card, so on fulfilment
 * it emits a "requestFulfilled" payload; the SINGLE active-GM client listens here
 * and folds the result into the card via {@link applyFulfillment}. Every other
 * client (including non-active GMs and the emitting player) ignores the payload.
 * Registered during the "ready" hook.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "./config.ts";
import { SOCKET_NAME } from "./dice/request-types.ts";
import type {
  RequestSocketPayload,
  RequestFulfilledPayload,
} from "./dice/request-types.ts";
import { applyFulfillment } from "./dice/request.ts";

/** True only on the client Foundry considers the active (writing) GM. */
function isActiveGM(): boolean {
  const active = (game as any).users?.activeGM;
  if (!active) return false;
  // `isSelf` is the canonical check; fall back to id comparison defensively.
  return active.isSelf ?? active.id === (game as any).user?.id;
}

export function registerSystemSocket(): void {
  const socket = (game as any).socket;
  if (!socket) {
    console.error(`${SYSTEM_ID} | game.socket unavailable; request updates disabled`);
    return;
  }

  socket.on(SOCKET_NAME, async (payload: RequestSocketPayload) => {
    try {
      // Only the single active-GM client is allowed to write the card.
      if (!isActiveGM()) return;
      if (!payload || payload.type !== "requestFulfilled") return;

      const fulfilled = payload as RequestFulfilledPayload;
      const message = (game as any).messages?.get(fulfilled.requestMessageId);
      if (!message) return;
      await applyFulfillment(message, fulfilled);
    } catch (err) {
      console.error(`${SYSTEM_ID} | socket handler failed`, err);
    }
  });
}
