/**
 * World / client settings for the system, plus a small typed accessor.
 *
 * Settings are consumed by the dice checks (Hunger / Remorse automation) and the
 * roll dialog (default difficulty). Names and hints are localized via
 * `GLUNIVERSE.Settings.*` keys in `lang/en.json`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "./config.ts";

export const SETTINGS = {
  automateHunger: "automateHunger",
  automateRemorse: "automateRemorse",
  defaultDifficulty: "defaultDifficulty",
  gmHud: "gmHud",
  colorScheme: "colorScheme",
  // Character-creation budgets (world scope, soft limits used by the builder).
  creationAttributes: "creationAttributes",
  creationSkillsJack: "creationSkillsJack",
  creationSkillsBalanced: "creationSkillsBalanced",
  creationSkillsSpecialist: "creationSkillsSpecialist",
  creationDisciplineDots: "creationDisciplineDots",
  creationAdvantageDots: "creationAdvantageDots",
  creationFlawDots: "creationFlawDots",
  creationBloodPotency: "creationBloodPotency",
  creationHumanity: "creationHumanity",
} as const;

export type SettingKey = (typeof SETTINGS)[keyof typeof SETTINGS];

/** Book-default creation budgets; both the setting defaults and the fallback. */
export const CREATION_DEFAULTS = {
  attributeSpread: "4,3,3,3,2,2,2,2,1",
  skillsJack: "3,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1",
  skillsBalanced: "3,3,3,2,2,2,2,2,1,1,1,1,1,1,1",
  skillsSpecialist: "4,3,3,3,2,2,2,1,1,1",
  disciplineDots: 2,
  advantageDots: 7,
  flawDots: 2,
  bloodPotency: 1,
  humanity: 7,
} as const;

/** Read a system setting; falls back to `fallback` before settings are ready. */
export function getSetting<T = unknown>(key: SettingKey, fallback: T): T {
  try {
    return (game as any).settings.get(SYSTEM_ID, key) as T;
  } catch {
    return fallback;
  }
}

/**
 * Stamp the chosen colour scheme onto <body>. The dark palette in
 * gluniverse-wod.css keys off these classes; "auto" stamps nothing and lets
 * Foundry's own theme-dark class (or prefers-color-scheme) decide.
 */
export function applyColorScheme(): void {
  const scheme = getSetting<string>(SETTINGS.colorScheme, "auto");
  document.body.classList.toggle("gl-scheme-dark", scheme === "dark");
  document.body.classList.toggle("gl-scheme-light", scheme === "light");
}

export function registerSettings(): void {
  const settings = (game as any).settings;

  settings.register(SYSTEM_ID, SETTINGS.colorScheme, {
    name: "GLUNIVERSE.Settings.ColorScheme.Name",
    hint: "GLUNIVERSE.Settings.ColorScheme.Hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      auto: "GLUNIVERSE.Settings.ColorScheme.Auto",
      light: "GLUNIVERSE.Settings.ColorScheme.Light",
      dark: "GLUNIVERSE.Settings.ColorScheme.Dark",
    },
    default: "auto",
    onChange: () => applyColorScheme(),
  });

  settings.register(SYSTEM_ID, SETTINGS.automateHunger, {
    name: "GLUNIVERSE.Settings.AutomateHunger.Name",
    hint: "GLUNIVERSE.Settings.AutomateHunger.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  settings.register(SYSTEM_ID, SETTINGS.automateRemorse, {
    name: "GLUNIVERSE.Settings.AutomateRemorse.Name",
    hint: "GLUNIVERSE.Settings.AutomateRemorse.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  settings.register(SYSTEM_ID, SETTINGS.defaultDifficulty, {
    name: "GLUNIVERSE.Settings.DefaultDifficulty.Name",
    hint: "GLUNIVERSE.Settings.DefaultDifficulty.Hint",
    scope: "client",
    config: true,
    type: Number,
    // 0 = no difficulty: the chat card just reports the number of successes.
    range: { min: 0, max: 10, step: 1 },
    default: 0,
  });

  settings.register(SYSTEM_ID, SETTINGS.gmHud, {
    name: "GLUNIVERSE.Settings.GmHud.Name",
    hint: "GLUNIVERSE.Settings.GmHud.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  // --- character-creation budgets (soft limits: the builder warns, never blocks)
  const creationString = (key: SettingKey, def: string) =>
    settings.register(SYSTEM_ID, key, {
      name: `GLUNIVERSE.Settings.${key.charAt(0).toUpperCase()}${key.slice(1)}.Name`,
      hint: `GLUNIVERSE.Settings.${key.charAt(0).toUpperCase()}${key.slice(1)}.Hint`,
      scope: "world",
      config: true,
      type: String,
      default: def,
    });
  const creationNumber = (key: SettingKey, def: number, max: number) =>
    settings.register(SYSTEM_ID, key, {
      name: `GLUNIVERSE.Settings.${key.charAt(0).toUpperCase()}${key.slice(1)}.Name`,
      hint: `GLUNIVERSE.Settings.${key.charAt(0).toUpperCase()}${key.slice(1)}.Hint`,
      scope: "world",
      config: true,
      type: Number,
      range: { min: 0, max, step: 1 },
      default: def,
    });

  creationString(SETTINGS.creationAttributes, CREATION_DEFAULTS.attributeSpread);
  creationString(SETTINGS.creationSkillsJack, CREATION_DEFAULTS.skillsJack);
  creationString(SETTINGS.creationSkillsBalanced, CREATION_DEFAULTS.skillsBalanced);
  creationString(SETTINGS.creationSkillsSpecialist, CREATION_DEFAULTS.skillsSpecialist);
  creationNumber(SETTINGS.creationDisciplineDots, CREATION_DEFAULTS.disciplineDots, 10);
  creationNumber(SETTINGS.creationAdvantageDots, CREATION_DEFAULTS.advantageDots, 30);
  creationNumber(SETTINGS.creationFlawDots, CREATION_DEFAULTS.flawDots, 10);
  creationNumber(SETTINGS.creationBloodPotency, CREATION_DEFAULTS.bloodPotency, 10);
  creationNumber(SETTINGS.creationHumanity, CREATION_DEFAULTS.humanity, 10);
}
