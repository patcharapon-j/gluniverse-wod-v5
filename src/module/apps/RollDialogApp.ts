/**
 * The V5 pool-builder dialog. A small ApplicationV2 that mounts a Svelte form so
 * the player can assemble a pool (attribute + skill + modifiers), set Hunger and
 * difficulty, optionally Blood Surge, and roll. On submit it rolls, posts the
 * chat card, and closes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { mount, unmount } from "svelte";
import RollDialog from "../sheets/RollDialog.svelte";
import { rollPool } from "../dice/roll-v5.ts";
import { postRollCard, rollCardHTML } from "../dice/chat.ts";
import { rouseCheck, bloodSurgeBonus } from "../dice/checks.ts";

export interface RollSeed {
  attribute?: string;
  skill?: string;
  flavor?: string;
  difficulty?: number;
}

const AppV2 = foundry.applications.api.ApplicationV2;

export class RollDialogApp extends AppV2 {
  static DEFAULT_OPTIONS = {
    id: "gl-roll-dialog",
    classes: ["gluniverse-wod", "gl-roll-dialog-app"],
    position: { width: 460, height: "auto" as const },
    window: { title: "Roll Dice Pool", resizable: false },
  };

  _actor: any;
  _seed: RollSeed;
  _svelte: any = null;

  constructor(actor: any, seed: RollSeed = {}, options: Record<string, unknown> = {}) {
    super(options);
    this._actor = actor;
    this._seed = seed;
  }

  async _renderHTML(): Promise<null> {
    return null;
  }

  _replaceHTML(_result: unknown, content: HTMLElement): void {
    if (this._svelte) return;
    const target: HTMLElement =
      content?.matches?.(".window-content") ? content
      : (content?.querySelector?.(".window-content") as HTMLElement) ?? content;
    this._svelte = mount(RollDialog, {
      target,
      props: {
        actor: this._actor,
        seed: this._seed,
        onroll: (o: RollDialogResult) => this._doRoll(o),
        oncancel: () => this.close(),
      },
    });
  }

  async _doRoll(o: RollDialogResult): Promise<void> {
    let pool = o.pool;
    if (o.bloodSurge) {
      pool += bloodSurgeBonus(this._actor.system.bloodPotency ?? 0);
      await rouseCheck(this._actor, { label: "Blood Surge — Rouse" });
    }
    const { result, roll } = await rollPool({ pool, hunger: o.hunger, difficulty: o.difficulty });
    await postRollCard(this._actor, result, roll, { flavor: o.flavor });
    await this.close();
  }

  async _onClose(options: unknown): Promise<void> {
    if (this._svelte) {
      unmount(this._svelte);
      this._svelte = null;
    }
    await super._onClose?.(options);
  }
}

export interface RollDialogResult {
  pool: number;
  hunger: number;
  difficulty: number;
  flavor: string;
  bloodSurge: boolean;
}

/** Convenience: open the pool dialog for an actor, seeded from a clicked trait. */
export function openRollDialog(actor: any, seed: RollSeed = {}): void {
  new RollDialogApp(actor, seed).render(true);
}

// Re-export so the sheet can preview a card without a full roll (unused stub kept
// intentionally minimal for now).
export { rollCardHTML };
