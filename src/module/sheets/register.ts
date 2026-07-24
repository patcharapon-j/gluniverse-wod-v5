/** Registers the system's ApplicationV2 document sheets. */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID, ITEM_TYPES } from "../config.ts";
import { makeActorSheet, makeItemSheet } from "../apps/svelte-sheets.ts";
import VampireSheet from "./VampireSheet.svelte";
import MortalSheet from "./MortalSheet.svelte";
import SpcSheet from "./SpcSheet.svelte";
import CoterieSheet from "./CoterieSheet.svelte";
import ItemSheet from "./ItemSheet.svelte";
import MobileSheet from "./MobileSheet.svelte";

export function registerSheets(): void {
  const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;

  // Player-character sheets get the compact mobile view on phone clients;
  // SPC / Coterie stay on the full sheet everywhere.
  const VampireApp = makeActorSheet(VampireSheet, { width: 1000, height: 940, mobileComponent: MobileSheet });
  const MortalApp = makeActorSheet(MortalSheet, { width: 1000, height: 820, mobileComponent: MobileSheet });
  const SpcApp = makeActorSheet(SpcSheet, { width: 760, height: 720 });
  const CoterieApp = makeActorSheet(CoterieSheet, { width: 800, height: 700 });
  const ItemApp = makeItemSheet(ItemSheet, { width: 520, height: 620 });

  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, VampireApp, {
    types: ["vampire"],
    makeDefault: true,
    label: "GLUniverse — Vampire",
  });
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, MortalApp, {
    types: ["mortal", "ghoul"],
    makeDefault: true,
    label: "GLUniverse — Mortal / Ghoul",
  });
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, SpcApp, {
    types: ["spc"],
    makeDefault: true,
    label: "GLUniverse — Antagonist",
  });
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, CoterieApp, {
    types: ["coterie"],
    makeDefault: true,
    label: "GLUniverse — Coterie",
  });
  DocumentSheetConfig.registerSheet(Item, SYSTEM_ID, ItemApp, {
    types: [...ITEM_TYPES],
    makeDefault: true,
    label: "GLUniverse — Item",
  });
}
