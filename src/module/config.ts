/**
 * GLUniverse — Vampire: The Masquerade V5 game constants.
 *
 * Fixed reference data (attributes, skills, clans, disciplines, predator types,
 * resonances) used by the data models, sheets, and dice engine. Keep this the
 * single source of truth for trait keys so the whole system stays in sync.
 */

export const SYSTEM_ID = "gluniverse-wod-v5";

/** Attribute keys grouped by category, in book order. */
export const ATTRIBUTES = {
  physical: ["strength", "dexterity", "stamina"],
  social: ["charisma", "manipulation", "composure"],
  mental: ["intelligence", "wits", "resolve"],
} as const;

/** Skill keys grouped by category, in book order (27 total). */
export const SKILLS = {
  physical: [
    "athletics",
    "brawl",
    "craft",
    "drive",
    "firearms",
    "larceny",
    "melee",
    "stealth",
    "survival",
  ],
  social: [
    "animalKen",
    "etiquette",
    "insight",
    "intimidation",
    "leadership",
    "performance",
    "persuasion",
    "streetwise",
    "subterfuge",
  ],
  mental: [
    "academics",
    "awareness",
    "finance",
    "investigation",
    "medicine",
    "occult",
    "politics",
    "science",
    "technology",
  ],
} as const;

export type AttributeCategory = keyof typeof ATTRIBUTES;
export type AttributeKey = (typeof ATTRIBUTES)[AttributeCategory][number];
export type SkillCategory = keyof typeof SKILLS;
export type SkillKey = (typeof SKILLS)[SkillCategory][number];

export const ATTRIBUTE_KEYS: AttributeKey[] = [
  ...ATTRIBUTES.physical,
  ...ATTRIBUTES.social,
  ...ATTRIBUTES.mental,
];
export const SKILL_KEYS: SkillKey[] = [
  ...SKILLS.physical,
  ...SKILLS.social,
  ...SKILLS.mental,
];

/** The thirteen clans plus Caitiff and Thin-blood. */
export const CLANS = [
  "brujah",
  "gangrel",
  "malkavian",
  "nosferatu",
  "toreador",
  "tremere",
  "ventrue",
  "banuHaqim",
  "hecata",
  "lasombra",
  "ministry",
  "ravnos",
  "salubri",
  "tzimisce",
  "caitiff",
  "thinBlood",
] as const;
export type Clan = (typeof CLANS)[number];

/** Disciplines. Blood Sorcery and Oblivion also drive Rituals / Ceremonies. */
export const DISCIPLINES = [
  "animalism",
  "auspex",
  "bloodSorcery",
  "celerity",
  "dominate",
  "fortitude",
  "obfuscate",
  "oblivion",
  "potence",
  "presence",
  "protean",
  "thinBloodAlchemy",
] as const;
export type Discipline = (typeof DISCIPLINES)[number];

/** Predator types (Core + Companion). */
export const PREDATOR_TYPES = [
  "alleycat",
  "bagger",
  "bloodLeech",
  "cleaver",
  "consensualist",
  "farmer",
  "osiris",
  "sandman",
  "sceneQueen",
  "siren",
  "extortionist",
  "graverobber",
  "roadsideKiller",
  "grimReaper",
  "montero",
  "pursuer",
  "trapdoor",
] as const;
export type PredatorType = (typeof PREDATOR_TYPES)[number];

/** Blood resonances and their emotional temperaments. */
export const RESONANCES = ["sanguine", "choleric", "melancholy", "phlegmatic", "empty", "animal"] as const;
export type Resonance = (typeof RESONANCES)[number];

export const RESONANCE_INTENSITIES = ["fleeting", "intense", "acute"] as const;

/** Advantage sub-kinds (the flexible advantage item type). */
export const ADVANTAGE_KINDS = ["merit", "flaw", "background", "loresheet"] as const;
export type AdvantageKind = (typeof ADVANTAGE_KINDS)[number];

/** Damage state cycling order for a single health/willpower box. */
export const DAMAGE_STATES = ["empty", "superficial", "aggravated"] as const;
export type DamageState = (typeof DAMAGE_STATES)[number];

/** Blood Potency table: rouse re-roll level, surge bonus, mend amount, bane severity, power bonus. */
export const BLOOD_POTENCY = [
  { surge: 1, mend: 1, powerBonus: 0, rouseReroll: 0, bane: 0 }, // 0
  { surge: 2, mend: 1, powerBonus: 0, rouseReroll: 1, bane: 2 }, // 1
  { surge: 2, mend: 2, powerBonus: 1, rouseReroll: 1, bane: 2 }, // 2
  { surge: 3, mend: 2, powerBonus: 1, rouseReroll: 2, bane: 3 }, // 3
  { surge: 3, mend: 3, powerBonus: 2, rouseReroll: 2, bane: 3 }, // 4
  { surge: 4, mend: 3, powerBonus: 2, rouseReroll: 3, bane: 4 }, // 5
  { surge: 4, mend: 3, powerBonus: 3, rouseReroll: 3, bane: 4 }, // 6
  { surge: 5, mend: 3, powerBonus: 3, rouseReroll: 4, bane: 5 }, // 7
  { surge: 5, mend: 4, powerBonus: 4, rouseReroll: 4, bane: 5 }, // 8
  { surge: 6, mend: 4, powerBonus: 4, rouseReroll: 5, bane: 6 }, // 9
  { surge: 6, mend: 5, powerBonus: 5, rouseReroll: 5, bane: 6 }, // 10
] as const;

/** Actor and Item subtypes, mirrored in system.json `documentTypes`. */
export const ACTOR_TYPES = ["vampire", "mortal", "ghoul", "spc", "coterie"] as const;
export const ITEM_TYPES = [
  "discipline",
  "power",
  "ritual",
  "ceremony",
  "advantage",
  "weapon",
  "armor",
  "gear",
] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];
export type ItemType = (typeof ITEM_TYPES)[number];
