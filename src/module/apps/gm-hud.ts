/**
 * Storyteller quick-roll HUD — a GM-only floating dice-pool roller pinned to the
 * bottom-right of the viewport. It is offset to the left of Foundry's sidebar and
 * re-offsets whenever the sidebar collapses/expands or the window resizes, so it
 * never sits under the chat log.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { mount } from "svelte";
import GmHud from "./GmHud.svelte";
import { rollPool } from "../dice/roll-v5.ts";
import { postRollCard } from "../dice/chat.ts";
import { getSetting, SETTINGS } from "../settings.ts";

const HUD_ID = "gl-gm-hud";

async function doRoll(o: { pool: number; hunger: number; difficulty: number }): Promise<void> {
  const { result, roll } = await rollPool({ pool: o.pool, hunger: o.hunger, difficulty: o.difficulty });
  await postRollCard(null, result, roll, { flavor: "Storyteller Pool" });
}

/** Mount the HUD for GMs and keep it clear of the sidebar. */
export function initGmHud(): void {
  if (!(game as any).user?.isGM) return;
  if (!getSetting(SETTINGS.gmHud, true)) return;
  if (document.getElementById(HUD_ID)) return;

  const host = document.createElement("div");
  host.id = HUD_ID;
  host.className = "gluniverse-wod";
  Object.assign(host.style, {
    position: "fixed",
    bottom: "12px",
    right: "320px",
    zIndex: "70",
  } as CSSStyleDeclaration);
  document.body.appendChild(host);

  mount(GmHud, { target: host, props: { onroll: doRoll } });

  const setOffset = (): void => {
    const sb =
      document.querySelector("#sidebar") ??
      document.querySelector("#ui-right") ??
      document.querySelector("aside#sidebar");
    const w = sb ? (sb as HTMLElement).getBoundingClientRect().width : 300;
    host.style.right = `${Math.round(w) + 14}px`;
  };
  setOffset();

  Hooks.on("collapseSidebar", () => window.setTimeout(setOffset, 60));
  Hooks.on("renderSidebar", () => setOffset());
  Hooks.on("renderSidebarTab", () => setOffset());
  window.addEventListener("resize", setOffset);
}
