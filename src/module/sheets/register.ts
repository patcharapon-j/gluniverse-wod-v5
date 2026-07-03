/** Registers the system's ApplicationV2 document sheets. */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID, ITEM_TYPES } from "../config.ts";
import { makeActorSheet, makeItemSheet } from "../apps/svelte-sheets.ts";
import VampireSheet from "./VampireSheet.svelte";
import ActorPlaceholder from "./ActorPlaceholder.svelte";
import ItemSheet from "./ItemSheet.svelte";

export function registerSheets(): void {
  const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;

  const VampireApp = makeActorSheet(VampireSheet, { width: 1000, height: 940 });
  const PlaceholderApp = makeActorSheet(ActorPlaceholder, { width: 720, height: 520 });
  const ItemApp = makeItemSheet(ItemSheet, { width: 520, height: 620 });

  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, VampireApp, {
    types: ["vampire"],
    makeDefault: true,
    label: "GLUniverse — Vampire",
  });
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, PlaceholderApp, {
    types: ["mortal", "ghoul", "spc", "coterie"],
    makeDefault: true,
    label: "GLUniverse — Actor",
  });
  DocumentSheetConfig.registerSheet(Item, SYSTEM_ID, ItemApp, {
    types: [...ITEM_TYPES],
    makeDefault: true,
    label: "GLUniverse — Item",
  });
}
