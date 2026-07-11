/**
 * XP purchase ledger and reversible mutations.
 *
 * Actor-field purchases are one Foundry update (trait + bank + ledger). Embedded
 * item changes are compensated if recording the ledger fails. Undo refuses to
 * overwrite a value changed after purchase, which keeps respecs safe.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { XpCategory } from "./xp.ts";

export type XpTarget =
  | { kind: "actor"; path: string; before: unknown; after: unknown }
  | { kind: "item"; itemId: string; path: string; before: unknown; after: unknown }
  | { kind: "createItem"; data: Record<string, unknown> }
  | {
      kind: "discipline";
      itemId?: string;
      disciplineData?: Record<string, unknown>;
      before: number;
      after: number;
      powerData: Record<string, any>;
    };

export interface XpPurchase {
  category: XpCategory;
  label: string;
  cost: number;
  target: XpTarget;
}

export interface XpHistoryEntry {
  id: string;
  category: string;
  label: string;
  cost: number;
  targetKind: "actor" | "item" | "createItem" | "discipline";
  targetId: string;
  path: string;
  before: string;
  after: string;
  createdAt: string;
  undone: boolean;
  undoneAt: string;
}

const clone = <T>(value: T): T => foundry.utils.deepClone(value);
const encode = (value: unknown): string => JSON.stringify(value);
const decode = (value: string): unknown => JSON.parse(value);
const same = (a: unknown, b: unknown): boolean => encode(a) === encode(b);

function cleanItemData(data: Record<string, any>): Record<string, any> {
  const cleaned = clone(data);
  for (const key of ["_id", "folder", "sort", "ownership", "_stats"]) delete cleaned[key];
  return cleaned;
}

function getProperty(object: any, path: string): unknown {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

export function xpHistory(actor: any): XpHistoryEntry[] {
  return clone(actor.system?.xp?.history ?? []);
}

export function activeXpSpent(actor: any): number {
  return xpHistory(actor)
    .filter((entry) => !entry.undone)
    .reduce((sum, entry) => sum + entry.cost, 0);
}

function randomId(): string {
  return foundry.utils.randomID?.() ?? crypto.randomUUID();
}

function makeEntry(purchase: XpPurchase, targetId = ""): XpHistoryEntry {
  const target = purchase.target;
  return {
    id: randomId(),
    category: purchase.category,
    label: purchase.label,
    cost: purchase.cost,
    targetKind: target.kind,
    targetId,
    path: target.kind === "actor" || target.kind === "item" ? target.path : "",
    before: target.kind === "createItem" ? "null" : encode(target.before),
    after: target.kind === "createItem" ? encode(cleanItemData(target.data)) : target.kind === "discipline" ? encode({ rating: target.after, power: cleanItemData(target.powerData), newDiscipline: !target.itemId }) : encode(target.after),
    createdAt: new Date().toISOString(),
    undone: false,
    undoneAt: "",
  };
}

async function purchaseWithXpUnlocked(actor: any, purchase: XpPurchase): Promise<XpHistoryEntry | null> {
  const available = Number(actor.system?.xp?.value ?? 0);
  const cost = Math.max(0, Math.floor(purchase.cost));
  if (!Number.isFinite(cost) || cost <= 0) throw new Error("XP cost must be a positive integer.");
  if (cost > available) {
    ui?.notifications?.warn?.(`${purchase.label} costs ${cost} XP; only ${available} is available.`);
    return null;
  }

  const target = purchase.target;
  const history = xpHistory(actor);
  let entry: XpHistoryEntry;

  if (target.kind === "actor") {
    if (!same(getProperty(actor, target.path), target.before)) {
      throw new Error(`${purchase.label} changed while the Experience window was open. Review it and try again.`);
    }
    entry = makeEntry({ ...purchase, cost });
    await actor.update({
      [target.path]: clone(target.after),
      "system.xp.value": available - cost,
      "system.xp.history": [...history, entry],
    });
  } else if (target.kind === "item") {
    const item = actor.items.get(target.itemId);
    if (!item) throw new Error(`The item for ${purchase.label} no longer exists.`);
    if (!same(getProperty(item, target.path), target.before)) {
      throw new Error(`${purchase.label} changed while the Experience window was open. Review it and try again.`);
    }
    entry = makeEntry({ ...purchase, cost }, item.id);
    await item.update({ [target.path]: clone(target.after) });
    try {
      await actor.update({
        "system.xp.value": available - cost,
        "system.xp.history": [...history, entry],
      });
    } catch (error) {
      await item.update({ [target.path]: clone(target.before) });
      throw error;
    }
  } else if (target.kind === "createItem") {
    const created = await actor.createEmbeddedDocuments("Item", [cleanItemData(target.data)]);
    const item = created?.[0];
    if (!item) throw new Error(`Could not add ${purchase.label} to the sheet.`);
    entry = makeEntry({ ...purchase, cost }, item.id);
    try {
      await actor.update({
        "system.xp.value": available - cost,
        "system.xp.history": [...history, entry],
      });
    } catch (error) {
      await item.delete();
      throw error;
    }
  } else {
    let discipline = target.itemId ? actor.items.get(target.itemId) : null;
    if (discipline && !same(discipline.system?.value, target.before)) {
      throw new Error(`${purchase.label} changed while the Experience window was open. Review it and try again.`);
    }
    let createdDiscipline = false;
    if (!discipline) {
      const created = await actor.createEmbeddedDocuments("Item", [cleanItemData(target.disciplineData ?? {})]);
      discipline = created?.[0];
      createdDiscipline = true;
    }
    if (!discipline) throw new Error(`Could not add ${purchase.label} to the sheet.`);
    if (!createdDiscipline) await discipline.update({ "system.value": target.after });
    const powerData = cleanItemData(target.powerData);
    powerData.system = { ...(powerData.system ?? {}), parentDiscipline: discipline.id };
    const powers = await actor.createEmbeddedDocuments("Item", [powerData]);
    const power = powers?.[0];
    if (!power) {
      if (createdDiscipline) await discipline.delete();
      else await discipline.update({ "system.value": target.before });
      throw new Error(`Could not add the selected power for ${purchase.label}.`);
    }
    entry = makeEntry({ ...purchase, cost }, encode({ disciplineId: discipline.id, powerId: power.id }));
    try {
      await actor.update({ "system.xp.value": available - cost, "system.xp.history": [...history, entry] });
    } catch (error) {
      await power.delete();
      if (createdDiscipline) await discipline.delete();
      else await discipline.update({ "system.value": target.before });
      throw error;
    }
  }

  return entry;
}

async function undoXpPurchaseUnlocked(actor: any, entryId: string): Promise<boolean> {
  const history = xpHistory(actor);
  const index = history.findIndex((entry) => entry.id === entryId);
  const entry = history[index];
  if (!entry || entry.undone) return false;

  const before = decode(entry.before);
  const after = decode(entry.after);
  const refunded = Number(actor.system?.xp?.value ?? 0) + entry.cost;
  const updated = history.map((candidate) =>
    candidate.id === entry.id
      ? { ...candidate, undone: true, undoneAt: new Date().toISOString() }
      : candidate,
  );

  if (entry.targetKind === "actor") {
    const current = getProperty(actor, entry.path);
    if (!same(current, after)) throw new Error(`${entry.label} changed after purchase and cannot be safely undone.`);
    await actor.update({
      [entry.path]: clone(before),
      "system.xp.value": refunded,
      "system.xp.history": updated,
    });
  } else if (entry.targetKind === "item") {
    const item = actor.items.get(entry.targetId);
    if (!item) throw new Error(`${entry.label} no longer exists and cannot be safely undone.`);
    const current = getProperty(item, entry.path);
    if (!same(current, after)) throw new Error(`${entry.label} changed after purchase and cannot be safely undone.`);
    await item.update({ [entry.path]: clone(before) });
    try {
      await actor.update({ "system.xp.value": refunded, "system.xp.history": updated });
    } catch (error) {
      await item.update({ [entry.path]: clone(after) });
      throw error;
    }
  } else if (entry.targetKind === "createItem") {
    const item = actor.items.get(entry.targetId);
    if (!item) throw new Error(`${entry.label} no longer exists and cannot be safely undone.`);
    if (!matchesSubset(item.toObject(), after)) {
      throw new Error(`${entry.label} changed after purchase and cannot be safely undone.`);
    }
    const data = item.toObject();
    await item.delete();
    try {
      await actor.update({ "system.xp.value": refunded, "system.xp.history": updated });
    } catch (error) {
      await actor.createEmbeddedDocuments("Item", [data]);
      throw error;
    }
  } else {
    const ids = decode(entry.targetId) as { disciplineId: string; powerId: string };
    const discipline = actor.items.get(ids.disciplineId);
    const power = actor.items.get(ids.powerId);
    const details = after as { rating: number; power: Record<string, unknown>; newDiscipline: boolean };
    if (!discipline || !power || !same(discipline.system?.value, details.rating) || !matchesSubset(power.toObject(), details.power)) {
      throw new Error(`${entry.label} changed after purchase and cannot be safely undone.`);
    }
    const disciplineData = discipline.toObject();
    const powerData = power.toObject();
    await power.delete();
    if (details.newDiscipline) await discipline.delete();
    else await discipline.update({ "system.value": before });
    try {
      await actor.update({ "system.xp.value": refunded, "system.xp.history": updated });
    } catch (error) {
      if (details.newDiscipline) await actor.createEmbeddedDocuments("Item", [disciplineData]);
      else await discipline.update({ "system.value": details.rating });
      await actor.createEmbeddedDocuments("Item", [powerData]);
      throw error;
    }
  }
  return true;
}

async function respecXpUnlocked(actor: any): Promise<number> {
  const entries = xpHistory(actor).filter((entry) => !entry.undone).reverse();
  preflightRespec(actor, entries);
  let count = 0;
  for (const entry of entries) {
    if (await undoXpPurchaseUnlocked(actor, entry.id)) count++;
  }
  return count;
}

const actorQueues = new WeakMap<object, Promise<void>>();

async function withActorXpLock<T>(actor: any, operation: () => Promise<T>): Promise<T> {
  const previous = actorQueues.get(actor) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.then(() => current);
  actorQueues.set(actor, queued);
  await previous;
  try { return await operation(); }
  finally {
    release();
    if (actorQueues.get(actor) === queued) actorQueues.delete(actor);
  }
}

export const purchaseWithXp = (actor: any, purchase: XpPurchase): Promise<XpHistoryEntry | null> =>
  withActorXpLock(actor, () => purchaseWithXpUnlocked(actor, purchase));

export const undoXpPurchase = (actor: any, entryId: string): Promise<boolean> =>
  withActorXpLock(actor, () => undoXpPurchaseUnlocked(actor, entryId));

export const respecXp = (actor: any): Promise<number> =>
  withActorXpLock(actor, () => respecXpUnlocked(actor));

function matchesSubset(actual: any, expected: any): boolean {
  if (expected === null || typeof expected !== "object") return same(actual, expected);
  if (Array.isArray(expected)) return Array.isArray(actual) && same(actual, expected);
  return Object.entries(expected).every(([key, value]) => matchesSubset(actual?.[key], value));
}

function setProperty(object: any, path: string, value: unknown): void {
  const parts = path.split(".");
  const last = parts.pop();
  if (!last) return;
  const parent = parts.reduce((current, part) => (current[part] ??= {}), object);
  parent[last] = clone(value);
}

/** Validate an entire reverse-order respec before changing the first document. */
function preflightRespec(actor: any, entries: XpHistoryEntry[]): void {
  const simulated = new Map<string, unknown>();
  for (const entry of entries) {
    const after = decode(entry.after);
    const before = decode(entry.before);
    if (entry.targetKind === "createItem") {
      const item = actor.items.get(entry.targetId);
      const projected = item?.toObject();
      if (projected) {
        const prefix = `item:${entry.targetId}:`;
        for (const [key, value] of simulated) {
          if (key.startsWith(prefix)) setProperty(projected, key.slice(prefix.length), value);
        }
      }
      if (!item || !matchesSubset(projected, after)) {
        throw new Error(`${entry.label} changed after purchase; no respec changes were made.`);
      }
      continue;
    }
    if (entry.targetKind === "discipline") {
      const ids = decode(entry.targetId) as { disciplineId: string; powerId: string };
      const discipline = actor.items.get(ids.disciplineId);
      const power = actor.items.get(ids.powerId);
      const details = after as { rating: number; power: Record<string, unknown> };
      const key = `discipline:${ids.disciplineId}`;
      const rating = simulated.has(key) ? simulated.get(key) : discipline?.system?.value;
      if (!discipline || !power || !same(rating, details.rating) || !matchesSubset(power.toObject(), details.power)) {
        throw new Error(`${entry.label} changed after purchase; no respec changes were made.`);
      }
      simulated.set(key, before);
      continue;
    }
    const document = entry.targetKind === "actor" ? actor : actor.items.get(entry.targetId);
    if (!document) throw new Error(`${entry.label} no longer exists; no respec changes were made.`);
    const key = `${entry.targetKind}:${entry.targetId}:${entry.path}`;
    const current = simulated.has(key) ? simulated.get(key) : getProperty(document, entry.path);
    if (!same(current, after)) throw new Error(`${entry.label} changed after purchase; no respec changes were made.`);
    simulated.set(key, before);
  }
}
