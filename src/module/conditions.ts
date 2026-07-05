/**
 * Token status conditions for V5. Registered onto `CONFIG.statusEffects` at
 * init so they appear in the token HUD. Names localize via
 * `GLUNIVERSE.Conditions.*`; icons are core Foundry art (no bundled assets).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Condition {
  id: string;
  name: string;
  img: string;
}

/** V5-flavored conditions plus a couple of universal states. */
export const CONDITIONS: Condition[] = [
  { id: "frenzy", name: "GLUNIVERSE.Conditions.Frenzy", img: "icons/svg/terror.svg" },
  { id: "terror", name: "GLUNIVERSE.Conditions.Terror", img: "icons/svg/eye.svg" },
  { id: "torpor", name: "GLUNIVERSE.Conditions.Torpor", img: "icons/svg/sleep.svg" },
  { id: "staked", name: "GLUNIVERSE.Conditions.Staked", img: "icons/svg/paralysis.svg" },
  { id: "impaired", name: "GLUNIVERSE.Conditions.Impaired", img: "icons/svg/downgrade.svg" },
  { id: "compulsion", name: "Compulsion", img: "icons/svg/daze.svg" },
  { id: "hunted", name: "GLUNIVERSE.Conditions.Hunted", img: "icons/svg/target.svg" },
  { id: "burning", name: "GLUNIVERSE.Conditions.Burning", img: "icons/svg/fire.svg" },
  { id: "sunlight", name: "GLUNIVERSE.Conditions.Sunlight", img: "icons/svg/sun.svg" },
  { id: "poisoned", name: "GLUNIVERSE.Conditions.Poisoned", img: "icons/svg/poison.svg" },
  { id: "blinded", name: "GLUNIVERSE.Conditions.Blinded", img: "icons/svg/blind.svg" },
  { id: "obfuscated", name: "GLUNIVERSE.Conditions.Obfuscated", img: "icons/svg/invisible.svg" },
  { id: "unconscious", name: "GLUNIVERSE.Conditions.Unconscious", img: "icons/svg/unconscious.svg" },
];

/** Replace the default status effects with the V5 set. */
export function registerConditions(): void {
  (CONFIG as any).statusEffects = CONDITIONS.map((c) => ({ ...c }));
  // Keep the "dead" marker Foundry expects for defeated combatants.
  (CONFIG as any).specialStatusEffects = {
    ...(CONFIG as any).specialStatusEffects,
    DEFEATED: "unconscious",
  };
}
