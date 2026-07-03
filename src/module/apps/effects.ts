/**
 * ActiveEffect helpers shared by the sheets.
 *
 * Like the item helpers, the Svelte sheets render their own DOM, so Foundry's
 * built-in effect controls never wire up. These give the components a typed
 * create / edit / delete / toggle surface over a document's effects.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Create a new, empty ActiveEffect on a document and open its config. */
export async function createEffect(doc: any): Promise<void> {
  const seed = {
    name: doc.name ? `New Effect` : "New Effect",
    img: "icons/svg/aura.svg",
    origin: doc.uuid,
    disabled: false,
    transfer: doc.documentName === "Item",
    changes: [],
  };
  const created = await doc.createEmbeddedDocuments("ActiveEffect", [seed]);
  created?.[0]?.sheet?.render(true);
}

/** Open an effect's config sheet. */
export function editEffect(doc: any, id: string): void {
  doc.effects.get(id)?.sheet?.render(true);
}

/** Toggle an effect's disabled state. */
export async function toggleEffect(doc: any, id: string): Promise<void> {
  const effect = doc.effects.get(id);
  if (!effect) return;
  await effect.update({ disabled: !effect.disabled });
}

/** Delete an effect after a lightweight confirm. */
export async function deleteEffect(doc: any, id: string): Promise<void> {
  const effect = doc.effects.get(id);
  if (!effect) return;
  const DialogV2 = foundry.applications?.api?.DialogV2;
  const name = foundry.utils.escapeHTML?.(effect.name) ?? effect.name;
  const confirmed = DialogV2?.confirm
    ? await DialogV2.confirm({
        window: { title: `Delete ${effect.name}?` },
        content: `<p>Delete the effect <strong>${name}</strong>? This cannot be undone.</p>`,
        rejectClose: false,
        modal: true,
      })
    : confirm(`Delete ${effect.name}?`);
  if (confirmed) await effect.delete();
}
