import { SYSTEM_ID } from "../config.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ChatArtTransform {
  x: number;
  y: number;
  scale: number;
}

export const DEFAULT_CHAT_ART: ChatArtTransform = { x: 0, y: 0, scale: 1 };

const finite = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Read unrestricted per-actor chat-art framing from system flags. */
export function actorChatArt(actor: any): ChatArtTransform {
  const raw = actor?.getFlag?.(SYSTEM_ID, "chatArt") ?? actor?.flags?.[SYSTEM_ID]?.chatArt ?? {};
  return {
    x: finite(raw.x, DEFAULT_CHAT_ART.x),
    y: finite(raw.y, DEFAULT_CHAT_ART.y),
    scale: finite(raw.scale, DEFAULT_CHAT_ART.scale),
  };
}

/** Sanitize stored/message framing without constraining its range. */
export function normalizeChatArt(value: Partial<ChatArtTransform> | undefined): ChatArtTransform {
  return {
    x: finite(value?.x, DEFAULT_CHAT_ART.x),
    y: finite(value?.y, DEFAULT_CHAT_ART.y),
    scale: finite(value?.scale, DEFAULT_CHAT_ART.scale),
  };
}
