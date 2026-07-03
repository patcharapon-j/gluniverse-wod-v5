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
} as const;

export type SettingKey = (typeof SETTINGS)[keyof typeof SETTINGS];

/** Read a system setting; falls back to `fallback` before settings are ready. */
export function getSetting<T = unknown>(key: SettingKey, fallback: T): T {
  try {
    return (game as any).settings.get(SYSTEM_ID, key) as T;
  } catch {
    return fallback;
  }
}

export function registerSettings(): void {
  const settings = (game as any).settings;

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
    range: { min: 1, max: 10, step: 1 },
    default: 2,
  });
}
