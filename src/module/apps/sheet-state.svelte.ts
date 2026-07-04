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
  /** Bumped on every sync so components can force-depend on freshness. */
  rev = $state(0);

  constructor(doc: any) {
    this.sync(doc);
  }

  sync(doc: any): void {
    this.name = doc.name;
    this.img = doc.img;
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
