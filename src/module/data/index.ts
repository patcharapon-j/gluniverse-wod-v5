/**
 * Registers all system DataModels onto CONFIG so Foundry uses them for the
 * declared Actor / Item subtypes.
 */

import { ACTOR_MODELS } from "./actors.ts";
import { ITEM_MODELS } from "./items.ts";

export function registerDataModels(): void {
  for (const [type, model] of Object.entries(ACTOR_MODELS)) {
    CONFIG.Actor.dataModels[type] = model;
  }
  for (const [type, model] of Object.entries(ITEM_MODELS)) {
    CONFIG.Item.dataModels[type] = model;
  }
}

export { ACTOR_MODELS } from "./actors.ts";
export { ITEM_MODELS } from "./items.ts";
