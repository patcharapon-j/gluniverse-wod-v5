/**
 * Item data models for VtM V5: disciplines & powers, blood-sorcery rituals,
 * oblivion ceremonies, advantages (merit/flaw/background/loresheet) and
 * equipment (weapon/armor/gear).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { DISCIPLINES, ADVANTAGE_KINDS } from "../config.ts";
import { int, str, html, bool, schema } from "./fields.ts";

/** Fields every item shares. */
const describable = (): Record<string, any> => ({
  description: html(),
  source: str(),
});

/** Discipline — a rated container (0–5) an actor owns; powers reference it. */
export class DisciplineData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      ...describable(),
      discipline: str("", { choices: [...DISCIPLINES] }),
      value: int(0, { min: 0, max: 5 }),
    };
  }
}

/** Power — a single Discipline power. */
export class PowerData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      ...describable(),
      discipline: str("", { choices: [...DISCIPLINES] }),
      // Id of the owning Discipline item on the actor, so powers nest under the
      // right instance (an actor can own the same discipline only once, but this
      // keeps the link explicit and drag-drop friendly).
      parentDiscipline: str(),
      level: int(1, { min: 1, max: 5 }),
      cost: str(), // e.g. "One Rouse Check"
      pool: str(), // dice pool string, e.g. "Charisma + Presence"
      opposingPool: str(),
      duration: str(),
      amalgam: schema({ discipline: str(), level: int(0, { min: 0, max: 5 }) }),
    };
  }
}

/** Blood Sorcery Ritual. */
export class RitualData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      ...describable(),
      level: int(1, { min: 1, max: 5 }),
      ingredients: str(),
      process: html(),
      pool: str(),
    };
  }
}

/** Oblivion Ceremony — same mechanical shape as a Ritual. */
export class CeremonyData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      ...describable(),
      level: int(1, { min: 1, max: 5 }),
      ingredients: str(),
      process: html(),
      pool: str(),
    };
  }
}

/** Advantage — merit, flaw, background, or loresheet entry. */
export class AdvantageData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      ...describable(),
      kind: str("merit", { choices: [...ADVANTAGE_KINDS] }),
      value: int(1, { min: 0, max: 5 }),
      maxValue: int(5, { min: 0, max: 5 }),
    };
  }
}

/** Weapon. */
export class WeaponData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      ...describable(),
      damage: int(0, { min: 0 }),
      damageType: str("superficial", { choices: ["superficial", "aggravated"] }),
      pool: str(),
      range: str(),
      concealment: str(),
      quantity: int(1, { min: 0 }),
      equipped: bool(false),
    };
  }
}

/** Armor. */
export class ArmorData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      ...describable(),
      rating: int(0, { min: 0 }),
      type: str(),
      penalty: int(0),
      equipped: bool(false),
    };
  }
}

/** Generic gear / possession. */
export class GearData extends (foundry.abstract.TypeDataModel as any) {
  static defineSchema(): any {
    return {
      ...describable(),
      quantity: int(1, { min: 0 }),
      cost: str(),
      equipped: bool(false),
    };
  }
}

export const ITEM_MODELS = {
  discipline: DisciplineData,
  power: PowerData,
  ritual: RitualData,
  ceremony: CeremonyData,
  advantage: AdvantageData,
  weapon: WeaponData,
  armor: ArmorData,
  gear: GearData,
};
