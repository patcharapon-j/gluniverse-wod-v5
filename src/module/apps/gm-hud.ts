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
import { openRequestRollDialog } from "./RequestRollApp.ts";

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

  mount(GmHud, { target: host, props: { onroll: doRoll, onrequest: openRequestRollDialog } });

  const findSidebar = (): HTMLElement | null =>
    (document.querySelector("#sidebar") ??
      document.querySelector("#ui-right") ??
      document.querySelector("aside#sidebar")) as HTMLElement | null;

  // How much viewport the sidebar actually covers on the right. Width alone
  // lies when the sidebar collapses via transform (it keeps its layout width),
  // and the left edge alone lies when the element isn't right-docked yet — the
  // smaller of the two is right in every state. Clamp so a bogus measurement
  // can never push the HUD off-screen.
  const setOffset = (): void => {
    const sb = findSidebar();
    let w = 300;
    if (sb) {
      const r = sb.getBoundingClientRect();
      w = r.width > 0 ? Math.min(r.width, window.innerWidth - r.left) : 0;
      w = Math.max(0, Math.min(w, 600));
    }
    host.style.right = `${Math.round(w) + 14}px`;
  };

  // The v13+ sidebar animates open/closed; a one-shot measurement lands
  // mid-transition, so re-measure every frame until things settle.
  let settleUntil = 0;
  let settling = false;
  const settle = (): void => {
    setOffset();
    if (performance.now() < settleUntil) requestAnimationFrame(settle);
    else settling = false;
  };
  const nudge = (): void => {
    settleUntil = performance.now() + 800;
    if (!settling) {
      settling = true;
      requestAnimationFrame(settle);
    }
  };

  let observed: HTMLElement | null = null;
  const observer = new ResizeObserver(() => setOffset());
  const reobserve = (): void => {
    const sb = findSidebar();
    if (sb && sb !== observed) {
      if (observed) observer.unobserve(observed);
      observer.observe(sb);
      observed = sb;
    }
  };

  setOffset();
  reobserve();

  Hooks.on("collapseSidebar", nudge);
  Hooks.on("renderSidebar", () => {
    reobserve();
    nudge();
  });
  window.addEventListener("resize", setOffset);
}
