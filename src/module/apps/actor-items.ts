/**
 * Embedded-item helpers shared by the actor sheets.
 *
 * The sheets render their own DOM (Svelte), so Foundry's built-in item-control
 * and drag-drop wiring never fires. These helpers give the components a small,
 * typed surface for the create / edit / delete / sort / drop lifecycle.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { prettify } from "../components/labels.ts";

/** Foundry's v14 drag-data reader, with a graceful fallback for older paths. */
function getDragEventData(event: DragEvent): any {
  const TextEditor =
    foundry.applications?.ux?.TextEditor?.implementation ??
    (globalThis as any).TextEditor;
  try {
    return TextEditor?.getDragEventData?.(event) ?? readRawDragData(event);
  } catch {
    return readRawDragData(event);
  }
}

function readRawDragData(event: DragEvent): any {
  try {
    return JSON.parse(event.dataTransfer?.getData("text/plain") ?? "{}");
  } catch {
    return {};
  }
}

/** Create a new embedded item of `type` and open its sheet for editing. */
export async function createItem(
  actor: any,
  type: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  const seed = foundry.utils.expandObject({ name: `New ${prettify(type)}`, type, ...data });
  const created = await actor.createEmbeddedDocuments("Item", [seed]);
  created?.[0]?.sheet?.render(true);
}

/** Open an embedded item's own sheet. */
export function editItem(actor: any, id: string): void {
  actor.items.get(id)?.sheet?.render(true);
}

/** Delete an embedded item after a lightweight confirm dialog. */
export async function deleteItem(actor: any, id: string): Promise<void> {
  const item = actor.items.get(id);
  if (!item) return;
  const DialogV2 = foundry.applications?.api?.DialogV2;
  const confirmed = DialogV2?.confirm
    ? await DialogV2.confirm({
        window: { title: `Delete ${item.name}?` },
        content: `<p>Delete <strong>${foundry.utils.escapeHTML?.(item.name) ?? item.name}</strong>? This cannot be undone.</p>`,
        rejectClose: false,
        modal: true,
      })
    : confirm(`Delete ${item.name}?`);
  if (confirmed) await item.delete();
}

/**
 * Handle a drop onto an actor sheet. Sorts within the same actor, otherwise
 * creates the dropped item on this actor. Returns true if handled.
 */
export async function handleActorDrop(actor: any, event: DragEvent): Promise<boolean> {
  const data = getDragEventData(event);
  if (!data || data.type !== "Item") return false;

  const item = await Item.implementation.fromDropData(data);
  if (!item) return false;

  // Reordering an item already on this actor: sort relative to a drop target.
  if (item.parent?.id === actor.id) {
    return sortOnDrop(actor, item, event);
  }

  await actor.createEmbeddedDocuments("Item", [item.toObject()]);
  return true;
}

/** Sort an owned item to the position of the `[data-item-id]` it was dropped on. */
async function sortOnDrop(actor: any, source: any, event: DragEvent): Promise<boolean> {
  const targetEl = (event.target as HTMLElement | null)?.closest?.("[data-item-id]") as
    | HTMLElement
    | null;
  const targetId = targetEl?.dataset?.itemId;
  if (!targetId || targetId === source.id) return true;

  const target = actor.items.get(targetId);
  if (!target || target.type !== source.type) return true;

  const siblings = actor.items.filter(
    (i: any) => i.type === source.type && i.id !== source.id,
  );
  const updates = foundry.utils.performIntegerSort(source, {
    target,
    siblings,
  });
  await actor.updateEmbeddedDocuments(
    "Item",
    updates.map((u: any) => ({ _id: u.target.id, sort: u.update.sort })),
  );
  return true;
}
