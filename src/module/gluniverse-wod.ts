/**
 * GLUniverse — World of Darkness V5
 *
 * System entry point. Registers data models and sheets during `init`; the
 * per-splat rules (VtM first) build out from here.
 */

import { SYSTEM_ID } from "./config.ts";
import { registerDataModels } from "./data/index.ts";
import { registerSheets } from "./sheets/register.ts";
import { registerChatActions } from "./dice/chat-actions.ts";
import { registerSettings } from "./settings.ts";
import { registerConditions } from "./conditions.ts";
import { openRollDialog } from "./apps/RollDialogApp.ts";
import { rouseCheck, remorseCheck } from "./dice/checks.ts";
import { frenzyCheck } from "./dice/frenzy.ts";

Hooks.once("init", () => {
  console.log(`${SYSTEM_ID} | Initializing GLUniverse — World of Darkness V5`);
  registerSettings();
  registerConditions();
  registerDataModels();
  registerSheets();
  registerChatActions();
});

Hooks.once("ready", () => {
  const version = game.system?.version ?? "unknown";
  // Public API for macros / modules: game.gluniverse.roll(actor), etc.
  (game as any).gluniverse = {
    openRollDialog,
    rouseCheck,
    remorseCheck,
    frenzyCheck,
  };
  console.log(`${SYSTEM_ID} | Ready (v${version})`);
});
