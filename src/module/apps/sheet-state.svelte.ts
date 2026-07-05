/**
 * Reactive snapshot of a Foundry document for Svelte 5.
 *
 * Foundry documents are not deeply reactive, so instead of trying to observe
 * them we keep a plain, runes-backed snapshot here. The sheet re-syncs it every
 * time Foundry re-renders (which it does automatically after any update), and
 * components read from the snapshot. Edits flow the other way through
 * `doc.update(...)`, which triggers the re-render → re-sync → reactive refresh.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ItemSnapshot {
  id: string;
  name: string;
  type: string;
  img: string;
  sort: number;
  system: any;
}

export interface EffectSnapshot {
  id: string;
  name: string;
  img: string;
  disabled: boolean;
  changes: { key: string; mode: number; value: string }[];
}

export class SheetState {
  name = $state("");
  img = $state("");
  system = $state<any>({});
  flags = $state<any>({});
  items = $state<ItemSnapshot[]>([]);
  effects = $state<EffectSnapshot[]>([]);
  /**
   * Whether the viewing user may modify the document. Mirrors the sheet's
   * `isEditable` (ownership + compendium locks), falling back to `doc.isOwner`.
   * GMs are always owners. Components gate every write behind this.
   */
  editable = $state(false);
  /**
   * True when the user's permission is exactly LIMITED (not OBSERVER/OWNER).
   * Actor sheets render a stripped-down portrait + biography view in this case.
   */
  limited = $state(false);
  /** Bumped on every sync so components can force-depend on freshness. */
  rev = $state(0);

  constructor(doc: any, app?: any) {
    this.sync(doc, app);
  }

  sync(doc: any, app?: any): void {
    this.name = doc.name;
    this.img = doc.img;
    // Prefer the ApplicationV2 sheet's own editable flag (respects ownership +
    // compendium locks); fall back to raw ownership when no app is available.
    this.editable = app?.isEditable ?? !!doc.isOwner;
    try {
      const user = (globalThis as any).game?.user;
      this.limited =
        !!user &&
        !!doc.testUserPermission?.(user, "LIMITED") &&
        !doc.testUserPermission?.(user, "OBSERVER");
    } catch {
      this.limited = false;
    }
    this.system = foundry.utils.deepClone(doc.system);
    this.flags = foundry.utils.deepClone(doc.flags ?? {});
    this.items = doc.items
      ? [...doc.items]
          .map((i: any) => ({
            id: i.id,
            name: i.name,
            type: i.type,
            img: i.img,
            sort: i.sort ?? 0,
            system: foundry.utils.deepClone(i.system),
          }))
          .sort((a, b) => a.sort - b.sort)
      : [];
    this.effects = doc.effects
      ? [...doc.effects].map((e: any) => ({
          id: e.id,
          name: e.name,
          img: e.img ?? e.icon ?? "icons/svg/aura.svg",
          disabled: !!e.disabled,
          changes: (e.changes ?? []).map((c: any) => ({
            key: c.key,
            mode: c.mode,
            value: String(c.value ?? ""),
          })),
        }))
      : [];
    this.rev++;
  }
}
