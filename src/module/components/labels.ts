/** Human-readable labels for trait keys, i18n-first with a prettified fallback. */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** camelCase → "Title Case" (animalKen → "Animal Ken", thinBlood → "Thin Blood"). */
export function prettify(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Localize `GLUNIVERSE.<group>.<key>`, else prettify the key. */
export function label(group: string, key: string): string {
  const path = `GLUNIVERSE.${group}.${key}`;
  const loc = game.i18n?.localize?.(path);
  return loc && loc !== path ? loc : prettify(key);
}
