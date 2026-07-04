/**
 * Step-by-step character builder window.
 *
 * Walks a player through V5 creation — concept, attributes, skills, Disciplines,
 * advantages, equipment — pulling selectable content from the system compendia
 * and writing choices straight onto the actor. Budgets come from the world
 * settings (see `registerSettings`) and are soft: the wizard warns when a step
 * is over or under the configured values but never blocks progress.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { mount, unmount } from "svelte";
import CharacterBuilder from "../sheets/CharacterBuilder.svelte";
import { SheetState } from "./sheet-state.svelte.ts";

const AppV2 = foundry.applications.api.ApplicationV2;

/** Embedded-document hooks that mean "this actor changed". */
const SYNC_HOOKS = ["updateActor", "createItem", "updateItem", "deleteItem"] as const;

export class BuilderApp extends AppV2 {
  static DEFAULT_OPTIONS = {
    classes: ["gluniverse-wod", "gl-builder-app"],
    position: { width: 820, height: 860 },
    window: { title: "Character Builder", resizable: true },
  };

  _actor: any;
  _svelte: any = null;
  _state: SheetState | null = null;
  _hookIds: { hook: string; id: number }[] = [];

  constructor(actor: any, options: Record<string, unknown> = {}) {
    super({ id: `gl-builder-${actor.id}`, ...options });
    this._actor = actor;
  }

  async _renderHTML(): Promise<null> {
    return null;
  }

  _replaceHTML(_result: unknown, content: HTMLElement): void {
    if (this._svelte && this._state) {
      this._state.sync(this._actor);
      return;
    }
    const target: HTMLElement =
      content?.matches?.(".window-content") ? content
      : (content?.querySelector?.(".window-content") as HTMLElement) ?? content;

    this._state = new SheetState(this._actor);
    // The dialog isn't a document sheet, so Foundry won't re-render it after
    // updates — re-sync the snapshot from the document hooks instead.
    for (const hook of SYNC_HOOKS) {
      const id = (Hooks as any).on(hook, (doc: any) => {
        const actor = doc?.documentName === "Actor" ? doc : doc?.parent;
        if (actor?.id === this._actor?.id) this._state?.sync(this._actor);
      });
      this._hookIds.push({ hook, id });
    }

    this._svelte = mount(CharacterBuilder, {
      target,
      props: { doc: this._actor, snap: this._state, onclose: () => this.close() },
    });
  }

  async _onClose(options: unknown): Promise<void> {
    for (const { hook, id } of this._hookIds) (Hooks as any).off(hook, id);
    this._hookIds = [];
    if (this._svelte) {
      unmount(this._svelte);
      this._svelte = null;
      this._state = null;
    }
    await super._onClose?.(options);
  }
}

export function openBuilder(actor: any): void {
  new BuilderApp(actor).render(true);
}
