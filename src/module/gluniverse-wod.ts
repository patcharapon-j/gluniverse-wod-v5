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
import { registerDiceTerms } from "./dice/terms.ts";
import { registerSettings, applyColorScheme } from "./settings.ts";
import { registerConditions } from "./conditions.ts";
import { openRollDialog } from "./apps/RollDialogApp.ts";
import { rouseCheck, remorseCheck } from "./dice/checks.ts";
import { frenzyCheck } from "./dice/frenzy.ts";
import { initGmHud } from "./apps/gm-hud.ts";
import { registerDiceSoNice } from "./apps/dice-so-nice.ts";
import { registerSystemSocket } from "./socket.ts";
import { openRequestRollDialog } from "./apps/RequestRollApp.ts";

Hooks.once("init", () => {
  console.log(`${SYSTEM_ID} | Initializing GLUniverse — World of Darkness V5`);
  registerSettings();
  registerConditions();
  registerDiceTerms();
  registerDataModels();
  registerSheets();
  registerChatActions();
  registerDiceSoNice();
});

Hooks.once("ready", () => {
  const version = game.system?.version ?? "unknown";
  // Public API for macros / modules: game.gluniverse.roll(actor), etc.
  (game as any).gluniverse = {
    openRollDialog,
    rouseCheck,
    remorseCheck,
    frenzyCheck,
    requestRoll: openRequestRollDialog,
  };
  registerSystemSocket();
  initGmHud();
  applyColorScheme();
  console.log(`${SYSTEM_ID} | Ready (v${version})`);
});
