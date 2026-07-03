/**
 * Thin wrappers over `foundry.data.fields` so schema definitions read cleanly.
 * Foundry's field classes are untyped here (see foundry-shim.d.ts); these
 * helpers return `any` and are consumed only inside DataModel schemas.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const F = () => foundry.data.fields;

export const int = (initial = 0, opts: Record<string, unknown> = {}): any =>
  new (F().NumberField)({ required: true, nullable: false, integer: true, initial, ...opts });

export const num = (initial = 0, opts: Record<string, unknown> = {}): any =>
  new (F().NumberField)({ required: true, nullable: false, initial, ...opts });

export const str = (initial = "", opts: Record<string, unknown> = {}): any =>
  new (F().StringField)({ required: true, blank: true, initial, ...opts });

export const choice = (choices: readonly string[], initial: string, opts: Record<string, unknown> = {}): any =>
  new (F().StringField)({ required: true, blank: true, choices: [...choices], initial, ...opts });

export const bool = (initial = false): any => new (F().BooleanField)({ required: true, initial });

export const html = (initial = ""): any =>
  new (F().HTMLField)({ required: true, blank: true, initial });

export const schema = (fields: Record<string, any>, opts: Record<string, unknown> = {}): any =>
  new (F().SchemaField)(fields, opts);

export const arr = (element: any, opts: Record<string, unknown> = {}): any =>
  new (F().ArrayField)(element, opts);

/** A rated trait (0–5 dots by default). */
export const trait = (initial = 0, max = 5): any => schema({ value: int(initial, { min: 0, max }) });

/** A skill: a rated trait plus free-text specialties. */
export const skillField = (): any =>
  schema({ value: int(0, { min: 0, max: 5 }), specialties: arr(str()) });

/** A damage track (Health / Willpower): superficial + aggravated marks, derived max. */
export const trackField = (): any =>
  schema({
    superficial: int(0, { min: 0 }),
    aggravated: int(0, { min: 0 }),
    max: int(0, { min: 0 }),
  });
