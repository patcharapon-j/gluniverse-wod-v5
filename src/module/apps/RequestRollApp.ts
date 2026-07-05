/**
 * The Storyteller roll-request dialog. A GM-only ApplicationV2 that mounts a
 * Svelte form for composing a roll request (flavor, targets, requested pool,
 * and static-DC or contested opposition). On submit it hands the assembled
 * RequestState to createRollRequest(), which posts the public request card.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { mount, unmount } from "svelte";
import RequestRoll from "./RequestRoll.svelte";
import { createRollRequest } from "../dice/request.ts";
import type { RequestState } from "../dice/request-types.ts";

const AppV2 = foundry.applications.api.ApplicationV2;

/** Actor subtypes that can be requested to roll / opposed by a real actor. */
const ELIGIBLE_TYPES = ["vampire", "mortal", "ghoul"];

export class RequestRollApp extends AppV2 {
  static DEFAULT_OPTIONS = {
    id: "gl-request-dialog",
    classes: ["gluniverse-wod", "gl-roll-dialog-app"],
    position: { width: 520, height: "auto" as const },
    window: { title: "Request a Roll", resizable: false },
  };

  _preselected: string[];
  _svelte: any = null;

  constructor(preselected: string[] = [], options: Record<string, unknown> = {}) {
    super(options);
    this._preselected = preselected;
  }

  async _renderHTML(): Promise<null> {
    return null;
  }

  _replaceHTML(_result: unknown, content: HTMLElement): void {
    if (this._svelte) return;
    const target: HTMLElement =
      content?.matches?.(".window-content") ? content
      : (content?.querySelector?.(".window-content") as HTMLElement) ?? content;
    this._svelte = mount(RequestRoll, {
      target,
      props: {
        preselected: this._preselected,
        onsubmit: (state: Omit<RequestState, "cancelled">) => this._doSubmit(state),
        oncancel: () => this.close(),
      },
    });
  }

  async _doSubmit(state: Omit<RequestState, "cancelled">): Promise<void> {
    await createRollRequest(state);
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

/**
 * Open the request dialog. GM-only; selected tokens whose actors are eligible
 * targets (owned vampire/mortal/ghoul) pre-populate the target chip list.
 */
export function openRequestRollDialog(): void {
  if (!(game as any).user?.isGM) {
    (ui as any).notifications?.warn?.("Only the Storyteller can request rolls.");
    return;
  }

  const preselected: string[] = ((canvas as any)?.tokens?.controlled ?? [])
    .map((t: any) => t.actor)
    .filter((a: any) => a && ELIGIBLE_TYPES.includes(a.type) && a.hasPlayerOwner)
    .map((a: any) => a.uuid);

  new RequestRollApp([...new Set(preselected)]).render(true);
}
