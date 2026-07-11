/** Reversible experience-spend dialog and chat receipts. */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { mount, unmount } from "svelte";
import XpDialog from "../sheets/XpDialog.svelte";
import { SYSTEM_ID } from "../config.ts";
import {
  purchaseWithXp,
  respecXp,
  undoXpPurchase,
  type XpHistoryEntry,
  type XpPurchase,
} from "../vtm/xp-ledger.ts";

const AppV2 = foundry.applications.api.ApplicationV2;

export class XpDialogApp extends AppV2 {
  static DEFAULT_OPTIONS = {
    id: "gl-xp-dialog",
    classes: ["gluniverse-wod", "gl-xp-dialog-app"],
    position: { width: 760, height: 720 },
    window: { title: "Experience", resizable: true },
  };

  _actor: any;
  _svelte: any = null;

  constructor(actor: any, options: Record<string, unknown> = {}) {
    super(options);
    this._actor = actor;
  }

  async _renderHTML(): Promise<null> { return null; }

  _replaceHTML(_result: unknown, content: HTMLElement): void {
    if (this._svelte) return;
    const target: HTMLElement = content?.matches?.(".window-content")
      ? content
      : (content?.querySelector?.(".window-content") as HTMLElement) ?? content;
    this._svelte = mount(XpDialog, { target, props: { actor: this._actor, onclose: () => this.close() } });
  }

  async _onClose(options: unknown): Promise<void> {
    if (this._svelte) { unmount(this._svelte); this._svelte = null; }
    await super._onClose?.(options);
  }
}

export function openXpDialog(actor: any): void { new XpDialogApp(actor).render(true); }

export async function buyWithXp(actor: any, purchase: XpPurchase): Promise<boolean> {
  const entry = await purchaseWithXp(actor, purchase);
  if (!entry) return false;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: xpCard(actor, "Experience Spent", `${entry.label} — <strong>${entry.cost} XP</strong> (${actor.system?.xp?.value ?? 0} left).`),
    flags: { [SYSTEM_ID]: { card: "xp", entryId: entry.id } },
  });
  return true;
}

export async function undoXp(actor: any, entry: XpHistoryEntry): Promise<boolean> {
  const ok = await undoXpPurchase(actor, entry.id);
  if (ok) await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: xpCard(actor, "Experience Refunded", `${entry.label} — <strong>${entry.cost} XP</strong> returned.`),
    flags: { [SYSTEM_ID]: { card: "xp-undo", entryId: entry.id } },
  });
  return ok;
}

export async function respecAllXp(actor: any): Promise<number> {
  const count = await respecXp(actor);
  if (count) await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: xpCard(actor, "Experience Respec", `${count} purchase${count === 1 ? "" : "s"} reversed and refunded.`),
    flags: { [SYSTEM_ID]: { card: "xp-respec" } },
  });
  return count;
}

function xpCard(actor: any, flavor: string, detail: string): string {
  const name = foundry.utils.escapeHTML?.(actor.name) ?? actor.name;
  return `<div class="gl-card gl-check"><div class="gl-card-head"><div class="gl-card-id"><span class="gl-card-actor">${name}</span><span class="gl-card-flavor">${flavor}</span></div></div><div class="gl-card-detail">${detail}</div></div>`;
}
