/* Small helpers shared across sheet components. */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Localize via Foundry's i18n, falling back to the key. */
export function t(key: string): string {
  return (game.i18n?.localize?.(key) as string) ?? key;
}

/** Clicking dot `index` (0-based): fill to index+1, or clear back to index if
 * that dot is already the highest filled (V5 toggle-down convention). */
export function dotToggle(current: number, index: number): number {
  return current === index + 1 ? index : index + 1;
}

/** Update a document field by path, returning the update promise. */
export function updateField(doc: any, path: string, value: unknown): Promise<any> {
  return doc.update({ [path]: value });
}
