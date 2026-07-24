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
  /**
   * Compact touch-first component mounted instead of `component` when the
   * client is a phone (see {@link isMobileClient}) and the viewer is a player
   * who owns the actor. Only player-character sheets pass one.
   */
  mobileComponent?: Component<any>;
}

/**
 * Phone-client detection. The GLUniverse Suite companion module stamps
 * `gl-mobile` on <body> when a phone connects; when the suite is absent we fall
 * back to a coarse-pointer + small-viewport heuristic so the system degrades
 * gracefully on its own.
 */
export function isMobileClient(): boolean {
  if (document.body.classList.contains("gl-mobile")) return true;
  try {
    return (
      matchMedia("(pointer: coarse)").matches &&
      Math.min(window.innerWidth, window.innerHeight) <= 820
    );
  } catch {
    return false;
  }
}

/**
 * Actors whose owner opted out of the mobile view via the sheet's "Full Sheet"
 * button. Runtime-only (module-level, never persisted): reload = mobile again.
 */
const fullSheetOverrides = new Set<string>();

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
      this._gl_syncMobileReturn();
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
      this._gl_svelte = mount(this._gl_component(), {
        target,
        props: { doc: this.document, snap: this._gl_state, app: this },
      });
    }

    /** Which component to mount right now: the mobile view for phone players. */
    _gl_component(): Component<any> {
      return this._gl_mobileActive() ? opts.mobileComponent! : component;
    }

    /**
     * Mobile view applies only to player-owned character sheets on a phone
     * client, and only until the player taps "Full Sheet" (session override).
     */
    _gl_mobileActive(): boolean {
      if (!opts.mobileComponent) return false;
      if ((globalThis as any).game?.user?.isGM) return false;
      if (!this.document?.isOwner) return false;
      if (fullSheetOverrides.has(this.document?.uuid)) return false;
      return isMobileClient();
    }

    /**
     * The mobile sheet's "Full Sheet" button is one-way without this: while a
     * phone player is on the full sheet, show a window-header button that
     * drops the override and remounts the mobile view.
     */
    _gl_syncMobileReturn(): void {
      const header = (this as any).element?.querySelector?.(".window-header") as HTMLElement | null;
      if (!header) return;
      const existing = header.querySelector(".gl-mobile-return");
      const show =
        !!opts.mobileComponent &&
        !(globalThis as any).game?.user?.isGM &&
        this.document?.isOwner &&
        isMobileClient() &&
        !this._gl_mobileActive();
      if (!show) {
        existing?.remove();
        return;
      }
      if (existing) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "header-control icon fa-solid fa-mobile-screen-button gl-mobile-return";
      btn.dataset.tooltip = "Back to mobile sheet";
      btn.setAttribute("aria-label", "Back to mobile sheet");
      btn.addEventListener("click", () => this.glSetFullSheet(false));
      header.insertBefore(btn, header.querySelector('[data-action="close"]'));
    }

    /** Runtime toggle between mobile and full view; remounts the Svelte root. */
    glSetFullSheet(full: boolean): void {
      const uuid = this.document?.uuid;
      if (!uuid) return;
      if (full) fullSheetOverrides.add(uuid);
      else fullSheetOverrides.delete(uuid);
      if (this._gl_svelte) {
        unmount(this._gl_svelte);
        this._gl_svelte = null;
        this._gl_state = null;
      }
      this.render(true);
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
