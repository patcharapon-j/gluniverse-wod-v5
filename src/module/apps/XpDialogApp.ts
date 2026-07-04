/**
 * Experience-spend dialog. Presents everything the character can currently raise
 * — Attributes, Skills, owned Disciplines, and Blood Potency — priced at V5 XP
 * costs against the clan's in-clan list, and applies the purchase: it raises the
 * trait, deducts unspent XP, and posts a short record to chat.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { mount, unmount } from "svelte";
import XpDialog from "../sheets/XpDialog.svelte";
import { SYSTEM_ID } from "../config.ts";

const AppV2 = foundry.applications.api.ApplicationV2;

export class XpDialogApp extends AppV2 {
  static DEFAULT_OPTIONS = {
    id: "gl-xp-dialog",
    classes: ["gluniverse-wod", "gl-xp-dialog-app"],
    position: { width: 560, height: "auto" as const },
    window: { title: "Spend Experience", resizable: true },
  };

  _actor: any;
  _svelte: any = null;

  constructor(actor: any, options: Record<string, unknown> = {}) {
    super(options);
    this._actor = actor;
  }

  async _renderHTML(): Promise<null> {
    return null;
  }

  _replaceHTML(_result: unknown, content: HTMLElement): void {
    if (this._svelte) return;
    const target: HTMLElement =
      content?.matches?.(".window-content") ? content
      : (content?.querySelector?.(".window-content") as HTMLElement) ?? content;
    this._svelte = mount(XpDialog, {
      target,
      props: { actor: this._actor, onclose: () => this.close() },
    });
  }

  async _onClose(options: unknown): Promise<void> {
    if (this._svelte) {
      unmount(this._svelte);
      this._svelte = null;
    }
    await super._onClose?.(options);
  }
}

export function openXpDialog(actor: any): void {
  new XpDialogApp(actor).render(true);
}

/** Deduct XP and post a record. Returns false if the actor can't afford it. */
export async function spendXp(actor: any, cost: number, description: string): Promise<boolean> {
  const available = actor.system?.xp?.value ?? 0;
  if (cost > available) {
    (ui as any)?.notifications?.warn?.(`Not enough XP: ${description} costs ${cost}, ${available} available.`);
    return false;
  }
  await actor.update({ "system.xp.value": available - cost });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="gl-card gl-check"><div class="gl-card-head"><div class="gl-card-id"><span class="gl-card-actor">${actor.name}</span><span class="gl-card-flavor">Experience Spent</span></div></div><div class="gl-card-detail">${foundry.utils.escapeHTML?.(description) ?? description} — <strong>${cost} XP</strong> (${available - cost} left).</div></div>`,
    flags: { [SYSTEM_ID]: { card: "xp" } },
  });
  return true;
}
