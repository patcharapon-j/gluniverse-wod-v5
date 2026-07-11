/**
 * Actor data models for VtM V5: vampire (PC), mortal, ghoul, spc (antagonist
 * block) and coterie (group). Each extends foundry.abstract.TypeDataModel and
 * computes its derived tracks / pools in prepareDerivedData.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { CLANS, PREDATOR_TYPES, RESONANCES, RESONANCE_INTENSITIES, BLOOD_POTENCY } from "../config.ts";
import { int, str, html, bool, schema, arr } from "./fields.ts";
import { attributesField, skillsField, detailsField, trackField, deriveTrack } from "./common.ts";

/** Durable audit record for a single XP purchase (including later undo/respec). */
const xpHistoryField = (): any =>
  arr(
    schema({
      id: str(),
      category: str(),
      label: str(),
      cost: int(0, { min: 0 }),
      targetKind: str(),
      targetId: str(),
      path: str(),
      before: str(),
      after: str(),
      createdAt: str(),
      undone: bool(false),
      undoneAt: str(),
    }),
  );

const xpField = (): any =>
  schema({ value: int(0, { min: 0 }), total: int(0, { min: 0 }), history: xpHistoryField() });

/**
 * Derive Humanity-vs-Stains overlap. In V5, when Stains fill boxes that overlap
 * the character's remaining Humanity (stains > 10 − humanity) the character is
 * Impaired. Sets `humanityImpaired` and `stainsOverlap` on the model.
 */
function deriveHumanityImpairment(model: any): void {
  const humanity = model.humanity?.value ?? 0;
  const stains = model.humanity?.stains ?? 0;
  const freeBoxes = 10 - humanity;
  model.stainsOverlap = Math.max(0, stains - freeBoxes);
  model.humanityImpaired = stains > freeBoxes;
}

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
        // Dyscrasia: a named, potent side-effect of feeding on an Acute
        // resonance. Free text so the table can describe its bespoke effect.
        dyscrasia: str(),
        dyscrasiaActive: bool(false),
      }),
      // Blood Bonds this vampire is part of — as a thrall (bound to another)
      // or a regnant (someone bound to them). `rating` is the current bond
      // strength (0–6). `actorUuid` links the other party when known.
      bonds: arr(
        schema({
          name: str(),
          actorUuid: str(),
          rating: int(0, { min: 0, max: 6 }),
          kind: str("thrall", { choices: ["thrall", "regnant"] }),
        }),
      ),
      details: detailsField(),
      xp: xpField(),
      convictions: arr(schema({ conviction: str(), touchstone: str() })),
      biography: html(),
    };
  }

  prepareDerivedData(): void {
    const a = (this as any).attributes;
    deriveTrack((this as any).health, (a.stamina?.value ?? 0) + 3);
    deriveTrack((this as any).willpower, (a.composure?.value ?? 0) + (a.resolve?.value ?? 0));

    // Bane Severity — from the Blood Potency table. Thin-bloods and Caitiff
    // have no clan bane, so their severity is 0 regardless of Blood Potency.
    const bp = Math.max(0, Math.min(10, Math.floor((this as any).bloodPotency ?? 0)));
    const clan = (this as any).clan;
    (this as any).baneSeverity =
      clan === "thinBlood" || clan === "caitiff" ? 0 : (BLOOD_POTENCY[bp]?.bane ?? 0);

    deriveHumanityImpairment(this as any);
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
      xp: xpField(),
      biography: html(),
    };
  }

  prepareDerivedData(): void {
    const a = (this as any).attributes;
    deriveTrack((this as any).health, (a.stamina?.value ?? 0) + 3);
    deriveTrack((this as any).willpower, (a.composure?.value ?? 0) + (a.resolve?.value ?? 0));
    deriveHumanityImpairment(this as any);
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
      bloodBond: schema({
        regnant: str(),
        rating: int(0, { min: 0, max: 6 }),
        // Structured link to the regnant actor plus the number of drinks taken
        // this bonding cycle (3 drinks from one vampire = a full bond).
        regnantUuid: str(),
        drinks: int(0, { min: 0, max: 3 }),
      }),
      vitae: int(0, { min: 0, max: 10 }),
      details: detailsField(),
      xp: xpField(),
      biography: html(),
    };
  }

  prepareDerivedData(): void {
    const a = (this as any).attributes;
    deriveTrack((this as any).health, (a.stamina?.value ?? 0) + 3);
    deriveTrack((this as any).willpower, (a.composure?.value ?? 0) + (a.resolve?.value ?? 0));
    deriveHumanityImpairment(this as any);
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
