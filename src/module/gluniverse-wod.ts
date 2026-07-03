/**
 * GLUniverse — World of Darkness V5
 *
 * System entry point. Registers data models and sheets during `init`; the
 * per-splat rules (VtM first) build out from here.
 */

import { SYSTEM_ID } from "./config.ts";
import { registerDataModels } from "./data/index.ts";
import { registerSheets } from "./sheets/register.ts";

Hooks.once("init", () => {
  console.log(`${SYSTEM_ID} | Initializing GLUniverse — World of Darkness V5`);
  registerDataModels();
  registerSheets();
});

Hooks.once("ready", () => {
  const version = game.system?.version ?? "unknown";
  console.log(`${SYSTEM_ID} | Ready (v${version})`);
});
