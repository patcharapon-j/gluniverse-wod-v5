/**
 * ApplicationV2 ↔ Svelte 5 bridge.
 *
 * A thin base that mounts a Svelte component into an ActorSheetV2 / ItemSheetV2
 * window and keeps a reactive {@link SheetState} snapshot in sync with the
 * document across Foundry's own re-renders. No third-party framework layer.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { mount, unmount, type Component } from "svelte";
import { SheetState } from "./sheet-state.svelte.ts";
import { handleActorDrop } from "./actor-items.ts";

interface SvelteSheetOptions {
  width?: number;
  height?: number;
}

/** Shared mixin body for both actor and item sheets. */
function svelteSheetMixin(Base: any, component: Component<any>, opts: SvelteSheetOptions) {
  return class extends Base {
    static DEFAULT_OPTIONS = {
      classes: ["gluniverse-wod", "gl-sheet-app"],
      position: { width: opts.width ?? 1020, height: opts.height ?? 900 },
      window: { resizable: true },
      form: { submitOnChange: false, closeOnSubmit: false },
    };

    _gl_svelte: any = null;
    _gl_state: SheetState | null = null;

    /** We render the DOM ourselves; give ApplicationV2 an empty context. */
    async _renderHTML(): Promise<null> {
      return null;
    }

    /** Mount once, then only re-sync the reactive snapshot on later renders. */
    _replaceHTML(_result: unknown, content: HTMLElement): void {
      if (this._gl_svelte && this._gl_state) {
        this._gl_state.sync(this.document, this);
        return;
      }
      // Resolve the content region whether ApplicationV2 hands us the frame or
      // the `.window-content` directly.
      const target: HTMLElement =
        content?.matches?.(".window-content") ? content
        : (content?.querySelector?.(".window-content") as HTMLElement) ?? content;
      this._gl_state = new SheetState(this.document, this);
      this._gl_svelte = mount(component, {
        target,
        props: { doc: this.document, snap: this._gl_state, app: this },
      });
    }

    /** Drop handler the Svelte root binds to; actor sheets accept items. */
    async glHandleDrop(event: DragEvent): Promise<boolean> {
      if (this.document?.documentName !== "Actor") return false;
      // Non-editable viewers (observers / limited) may not add to the actor.
      if (!this.isEditable) return false;
      return handleActorDrop(this.document, event);
    }

    /**
     * Neutralize ActorSheetV2's built-in drop handling (v13+). The Svelte root
     * owns drops via {@link glHandleDrop}; the bubbled event would otherwise
     * reach the core handler too and create the document a second time.
     */
    async _onDrop(_event: DragEvent): Promise<void> {}

    async _onClose(options: unknown): Promise<void> {
      if (this._gl_svelte) {
        unmount(this._gl_svelte);
        this._gl_svelte = null;
        this._gl_state = null;
      }
      await super._onClose?.(options);
    }
  };
}

export function makeActorSheet(component: Component<any>, opts: SvelteSheetOptions = {}): any {
  return svelteSheetMixin(foundry.applications.sheets.ActorSheetV2, component, opts);
}

export function makeItemSheet(component: Component<any>, opts: SvelteSheetOptions = {}): any {
  return svelteSheetMixin(foundry.applications.sheets.ItemSheetV2, component, {
    width: opts.width ?? 520,
    height: opts.height ?? 600,
  });
}
