/**
 * Actor data models for VtM V5: vampire (PC), mortal, ghoul, spc (antagonist
 * block) and coterie (group). Each extends foundry.abstract.TypeDataModel and
 * computes its derived tracks / pools in prepareDerivedData.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { CLANS, PREDATOR_TYPES, RESONANCES, RESONANCE_INTENSITIES } from "../config.ts";
import { int, str, html, schema, arr } from "./fields.ts";
import { attributesField, skillsField, detailsField, trackField, deriveTrack } from "./common.ts";

/** Vampire — the full player-character model. */
export class VampireData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      attributes: attributesField(),
      skills: skillsField(),
      health: trackField(),
      willpower: trackField(),
      hunger: int(1, { min: 0, max: 5 }),
      humanity: schema({
        value: int(7, { min: 0, max: 10 }),
        stains: int(0, { min: 0, max: 10 }),
      }),
      bloodPotency: int(1, { min: 0, max: 10 }),
      clan: str("", { choices: [...CLANS] }),
      generation: int(13, { min: 3, max: 16 }),
      predator: str("", { choices: [...PREDATOR_TYPES] }),
      sire: str(),
      resonance: schema({
        type: str("", { choices: [...RESONANCES] }),
        intensity: str("", { choices: [...RESONANCE_INTENSITIES] }),
      }),
      details: detailsField(),
      xp: schema({ value: int(0, { min: 0 }), total: int(0, { min: 0 }) }),
      convictions: arr(schema({ conviction: str(), touchstone: str() })),
      biography: html(),
    };
  }

  prepareDerivedData(): void {
    const a = (this as any).attributes;
    deriveTrack((this as any).health, (a.stamina?.value ?? 0) + 3);
    deriveTrack((this as any).willpower, (a.composure?.value ?? 0) + (a.resolve?.value ?? 0));
  }
}

/** Mortal — humans and other non-supernatural characters. */
export class MortalData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      attributes: attributesField(),
      skills: skillsField(),
      health: trackField(),
      willpower: trackField(),
      humanity: schema({ value: int(7, { min: 0, max: 10 }), stains: int(0, { min: 0, max: 10 }) }),
      details: detailsField(),
      xp: schema({ value: int(0, { min: 0 }), total: int(0, { min: 0 }) }),
      biography: html(),
    };
  }

  prepareDerivedData(): void {
    const a = (this as any).attributes;
    deriveTrack((this as any).health, (a.stamina?.value ?? 0) + 3);
    deriveTrack((this as any).willpower, (a.composure?.value ?? 0) + (a.resolve?.value ?? 0));
  }
}

/** Ghoul — blood-bound servant: mortal frame plus limited Discipline access. */
export class GhoulData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      attributes: attributesField(),
      skills: skillsField(),
      health: trackField(),
      willpower: trackField(),
      humanity: schema({ value: int(7, { min: 0, max: 10 }), stains: int(0, { min: 0, max: 10 }) }),
      bloodBond: schema({ regnant: str(), rating: int(0, { min: 0, max: 6 }) }),
      vitae: int(0, { min: 0, max: 10 }),
      details: detailsField(),
      xp: schema({ value: int(0, { min: 0 }), total: int(0, { min: 0 }) }),
      biography: html(),
    };
  }

  prepareDerivedData(): void {
    const a = (this as any).attributes;
    deriveTrack((this as any).health, (a.stamina?.value ?? 0) + 3);
    deriveTrack((this as any).willpower, (a.composure?.value ?? 0) + (a.resolve?.value ?? 0));
  }
}

/** SPC / antagonist — the compact stat-pool block from the design. */
export class SpcData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      archetype: str(),
      attributePools: schema({
        physical: int(0, { min: 0 }),
        social: int(0, { min: 0 }),
        mental: int(0, { min: 0 }),
      }),
      standardPools: arr(schema({ label: str(), value: int(0, { min: 0 }) })),
      disciplines: arr(schema({ name: str(), value: int(0, { min: 0, max: 5 }) })),
      health: int(5, { min: 0 }),
      willpower: int(4, { min: 0 }),
      humanity: int(7, { min: 0, max: 10 }),
      hunger: int(0, { min: 0, max: 5 }),
      notes: html(),
    };
  }
}

/** Coterie — a shared group sheet with a Domain. */
export class CoterieData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      coterieType: str(),
      domain: schema({
        chasse: int(0, { min: 0, max: 5 }),
        lien: int(0, { min: 0, max: 5 }),
        portillon: int(0, { min: 0, max: 5 }),
      }),
      members: arr(str()),
      backgrounds: arr(schema({ name: str(), value: int(0, { min: 0, max: 5 }), note: str() })),
      notes: html(),
    };
  }
}

export const ACTOR_MODELS = {
  vampire: VampireData,
  mortal: MortalData,
  ghoul: GhoulData,
  spc: SpcData,
  coterie: CoterieData,
};
