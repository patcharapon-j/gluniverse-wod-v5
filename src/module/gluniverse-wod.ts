/**
 * GLUniverse — World of Darkness V5
 *
 * Entry point for the Foundry VTT game system. This is intentionally a thin
 * bootstrap for now; the data models, sheets, dice mechanics, and per-splat
 * rules land during implementation.
 */

const SYSTEM_ID = "gluniverse-wod-v5";

Hooks.once("init", () => {
  console.log(`${SYSTEM_ID} | Initializing GLUniverse World of Darkness V5`);
});

Hooks.once("ready", () => {
  const version = game.system?.version ?? "unknown";
  console.log(`${SYSTEM_ID} | Ready (v${version})`);
});
