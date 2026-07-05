/**
 * System socket — the cross-client channel for GM-mediated writes.
 *
 * A player's client cannot update documents it does not own, so it emits a
 * payload here and the SINGLE active-GM client performs the write:
 * - "requestFulfilled": folds a roll result into the GM-authored request card
 *   via {@link applyFulfillment}.
 * - "applyDamage": applies weapon damage to an actor the player cannot write
 *   via {@link applyDamageToActor}.
 * Every other client (including non-active GMs and the emitting player) ignores
 * the payload. Registered during the "ready" hook.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "./config.ts";
import { SOCKET_NAME } from "./dice/request-types.ts";
import type {
  RequestSocketPayload,
  RequestFulfilledPayload,
  ApplyDamagePayload,
} from "./dice/request-types.ts";
import { applyFulfillment } from "./dice/request.ts";
import { applyDamageToActor } from "./dice/chat-actions.ts";

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
      // Only the single active-GM client is allowed to perform the write.
      if (!isActiveGM()) return;
      if (!payload) return;

      if (payload.type === "requestFulfilled") {
        const fulfilled = payload as RequestFulfilledPayload;
        const message = (game as any).messages?.get(fulfilled.requestMessageId);
        if (!message) return;
        await applyFulfillment(message, fulfilled);
      } else if (payload.type === "applyDamage") {
        const damage = payload as ApplyDamagePayload;
        const actor: any = await fromUuid(damage.targetActorUuid);
        if (!actor) return;
        await applyDamageToActor(actor, damage);
      }
    } catch (err) {
      console.error(`${SYSTEM_ID} | socket handler failed`, err);
    }
  });
}
