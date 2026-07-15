/**
 * Chat-card rendering for the dice engine.
 *
 * A card is a normal Foundry chat message: it carries the real `Roll` objects
 * (so Dice So Nice animates and the dice log records them) and embeds Foundry's
 * own rendered dice breakdown in a collapsible section, so the message reads as a
 * first-class Foundry roll card while keeping the system's parchment styling for
 * the summary. Buttons are wired by a delegated listener in {@link ./chat-actions.ts}.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "../config.ts";
import type { V5RollResult } from "./roll-v5.ts";
import { actorChatArt, normalizeChatArt, type ChatArtTransform } from "./chat-art.ts";

const OUTCOME_LABEL: Record<string, string> = {
  critical: "Critical",
  messy: "Messy Critical",
  success: "Success",
  failure: "Failure",
  bestial: "Bestial Failure",
  totalFailure: "Total Failure",
};

function esc(s: string): string {
  return foundry.utils.escapeHTML?.(s) ?? String(s);
}

/** Which system die a chip renders as: regular pool, Hunger, or Rouse. */
type DieChipKind = "regular" | "hunger" | "rouse";

/**
 * One die chip: regular / Hunger / Rouse, glyph faces for successes/crits/banes.
 * Glyphs are CSS-masked `<i>` elements (Foundry sanitizes chat HTML and strips
 * inline `<svg>`); the mask images are the same SVG files the Dice So Nice
 * presets use, coloured by the chip's `currentColor`.
 */
function dieChip(value: number, kind: DieChipKind, rerolled = false, index?: number): string {
  const cls = ["gl-die"];
  if (kind !== "regular") cls.push(kind);
  let face: string | null = null;
  if (kind === "rouse") {
    // A Rouse check has no crit or bane — every success face wears the same
    // heart-and-bolt glyph, mirroring the physical die.
    if (value >= 6) {
      cls.push("hit");
      face = "gl-face-rouse";
    } else {
      cls.push("miss");
    }
  } else if (value === 10) {
    cls.push("crit");
    face = kind === "hunger" ? "gl-face-messy" : "gl-face-crit";
  } else if (value >= 6) {
    cls.push("hit");
    face = "gl-face-mark";
  } else if (kind === "hunger" && value === 1) {
    cls.push("bane");
    face = "gl-face-bestial";
  } else {
    cls.push("miss");
  }
  if (rerolled) cls.push("rerolled");
  const kindLabel = kind === "hunger" ? "Hunger die" : kind === "rouse" ? "Rouse die" : "Die";
  const title = `${kindLabel}: ${value}${rerolled ? " — Willpower re-roll" : ""}`;
  // Failure faces are blank like the real dice; the value stays as the corner
  // numeral and the tooltip.
  const body = `${face ? `<i class="gl-face ${face}"></i>` : ""}<em>${value}</em>`;
  // Regular dice carry their pool index so the Willpower re-roll can offer
  // click-to-select; Hunger and Rouse dice may never be re-rolled (V5 core).
  const data =
    index !== undefined && kind === "regular" ? ` data-die-index="${index}"` : "";
  // `--gl-i` staggers the entrance animation (see gluniverse-wod.css).
  const stagger = index !== undefined ? ` style="--gl-i:${index}"` : "";
  return `<span class="${cls.join(" ")}" title="${title}"${data}${stagger}>${body}</span>`;
}

function diceRow(result: V5RollResult): string {
  const chips = result.dice
    .map((d, i) => dieChip(d.value, d.hunger ? "hunger" : "regular", d.rerolled, i))
    .join("");
  return `<div class="gl-dice">${chips}</div>`;
}

/** Weapon context threaded through a roll's flags for the damage pipeline. */
export interface WeaponRollInfo {
  id?: string;
  name: string;
  /** Weapon damage rating (added to the margin on a win). */
  damage: number;
  damageType: "superficial" | "aggravated";
}

/**
 * V5 damage inflicted by a winning attack roll: margin (successes − difficulty)
 * plus the weapon's damage rating, minimum 1 on any win. At difficulty 0
 * (open-ended) the margin is simply the success total.
 */
export function weaponDamageTotal(result: V5RollResult, weapon: WeaponRollInfo): number {
  if (!result.won) return 0;
  return Math.max(1, result.margin + Math.max(0, weapon.damage));
}

/**
 * Whether a roll result warrants offering a Compulsion for a given actor: the
 * actor must be a vampire and the outcome a Bestial Failure, potential Bestial
 * Failure (open-ended win with a Hunger 1), or Messy Critical.
 */
export function compulsionEligible(actor: any, result: V5RollResult): boolean {
  if (actor?.type !== "vampire") return false;
  const potentialBestial =
    result.difficulty <= 0 && result.won && result.hungerOnes > 0;
  return result.bestial || result.messy || potentialBestial;
}

export interface RollCardOptions {
  actorName: string;
  img?: string;
  artTransform?: ChatArtTransform;
  result: V5RollResult;
  flavor: string;
  /** Show the blood-surge band + a Rouse note. */
  bloodSurge?: boolean;
  /** Extra italic note under the dice (e.g. the Willpower re-roll line). */
  note?: string;
  /** Human note when the rolled pool deviated from a request's asked pool. */
  deviation?: string;
  /** Weapon context — a winning roll shows a damage summary + Apply Damage. */
  weapon?: WeaponRollInfo;
  /** Vampire actor on a bestial/messy outcome — offer the Compulsion button. */
  showCompulsion?: boolean;
}

export interface CardHeroOptions {
  actorName: string;
  flavor: string;
  img?: string;
  artTransform?: ChatArtTransform;
  /** Roll cards reserve the stage for the actor name and result only. */
  minimal?: boolean;
  /** Compact narrative checks and utility cards use a shallower art stage. */
  compact?: boolean;
  /** Result UI placed at the foot of the image stage. */
  overlay?: string;
}

/**
 * Art-led identity stage shared by rolls, checks, Compulsions, and narrative
 * notices. The actor image supplies a blurred backdrop and a sharp foreground
 * crop; missing images intentionally fall back to a typographic header.
 */
export function cardHeroHTML(opts: CardHeroOptions): string {
  const classes = ["gl-card-hero"];
  if (opts.compact) classes.push("gl-card-hero--compact");
  if (opts.minimal) classes.push("gl-card-hero--minimal");
  classes.push(opts.img ? "gl-card-hero--art" : "gl-card-hero--fallback");
  const artTransform = normalizeChatArt(opts.artTransform);
  const artStyle = ` style="--gl-art-x:${artTransform.x}px;--gl-art-y:${artTransform.y}px;--gl-art-scale:${artTransform.scale}"`;
  const art = opts.img
    ? `<img class="gl-card-art gl-card-art--back" src="${esc(opts.img)}" alt="" onerror="this.style.display='none'"/>
       <img class="gl-card-art gl-card-art--subject" src="${esc(opts.img)}" alt="${esc(opts.actorName)}" onerror="this.style.display='none'"/>`
    : "";
  return `<div class="${classes.join(" ")}"${artStyle}>
    ${art}
    <div class="gl-card-id">
      <span class="gl-card-actor">${esc(opts.actorName)}</span>
      ${opts.minimal ? "" : `<span class="gl-card-flavor">${esc(opts.flavor)}</span>`}
    </div>
    ${opts.overlay ?? ""}
  </div>`;
}

/** Build the roll-card body (the message content Foundry wraps in its chrome). */
function rollCardHTMLLegacy(opts: RollCardOptions): string {
  const { result } = opts;
  // Difficulty 0 = open-ended roll: no Success/Failure verdict, just the tally.
  // Crits (and Messy) still show; a rolled Hunger 1 flags a potential Bestial
  // Failure since the Storyteller may yet rule the total a failure.
  const openEnded = result.difficulty <= 0;
  const potentialBestial = openEnded && result.won && result.hungerOnes > 0;
  const showBadge =
    !openEnded || !["success", "failure"].includes(result.outcome);
  const badge = OUTCOME_LABEL[result.outcome] ?? "Result";
  const vsLine = openEnded
    ? ""
    : `<span class="gl-vs">vs Difficulty ${result.difficulty}</span>`;
  const critNote =
    result.critPairs > 0
      ? `<span class="gl-crit-note">+${result.bonusSuccesses} from ${result.critPairs} critical pair${result.critPairs > 1 ? "s" : ""}</span>`
      : "";
  const canReroll =
    !result.willpowerUsed && result.dice.some((d) => !d.hunger && !d.rerolled);
  const plural = (n: number, w: string) =>
    `${n} ${n === 1 ? w : w === "success" ? "successes" : `${w}s`}`;

  const portrait = opts.img
    ? `<img class="gl-card-portrait" src="${esc(opts.img)}" alt="" onerror="this.style.display='none'"/>`
    : "";

  // Weapon rolls that won show the V5 damage line (margin + weapon rating).
  let damageBlock = "";
  const showDamage = !!opts.weapon && result.won;
  if (opts.weapon && showDamage) {
    const dmg = weaponDamageTotal(result, opts.weapon);
    damageBlock = `
    <div class="gl-card-damage">
      <span class="gl-dmg-total"><b>${dmg}</b> ${esc(opts.weapon.damageType)} damage</span>
      <span class="gl-dmg-calc">margin ${result.margin} + ${esc(opts.weapon.name)} ${opts.weapon.damage}${result.margin + opts.weapon.damage < 1 ? " (min 1)" : ""}</span>
    </div>`;
  }

  const actionButtons: string[] = [];
  if (canReroll) {
    actionButtons.push(
      `<button type="button" class="gl-act" data-gl-action="wp-reroll">Willpower Re-roll</button>`,
    );
  }
  if (showDamage) {
    actionButtons.push(
      `<button type="button" class="gl-act" data-gl-action="apply-damage">Apply Damage</button>`,
    );
  }
  // On a Bestial Failure, potential Bestial Failure, or Messy Critical the
  // Storyteller may impose a Compulsion (vampires only).
  if (opts.showCompulsion) {
    actionButtons.push(
      `<button type="button" class="gl-act gl-act-compulsion" data-gl-action="compulsion">Compulsion…</button>`,
    );
  }

  return `
  <div class="gl-card ${opts.bloodSurge ? "gl-surge" : ""}" data-outcome="${result.outcome}">
    ${opts.bloodSurge ? `<div class="gl-surge-band" aria-hidden="true"></div>` : ""}
    <div class="gl-card-head">
      ${portrait}
      <div class="gl-card-id">
        <span class="gl-card-actor">${esc(opts.actorName)}</span>
        <span class="gl-card-flavor">${esc(opts.flavor)}</span>
      </div>
    </div>

    <div class="gl-card-tally gl-out-${result.outcome}">
      <div class="gl-tally-num"><b>${result.successes}</b><span>${result.successes === 1 ? "success" : "successes"}</span></div>
      <div class="gl-tally-badge">${showBadge ? `<span class="gl-badge">${badge}</span>` : ""}${vsLine}</div>
    </div>

    ${opts.bloodSurge ? `<div class="gl-surge-tag">Blood Surge — Rouse the Blood</div>` : ""}

    ${potentialBestial ? `<div class="gl-bestial-warn">⚠ Potential Bestial Failure</div>` : ""}

    ${diceRow(result)}

    <div class="gl-card-meta">
      ${critNote}
      ${result.hungerOnes > 0 ? `<span class="gl-bane-note">${plural(result.hungerOnes, "Hunger&nbsp;1")}</span>` : ""}
      ${result.messy ? `<span class="gl-bane-note">Messy</span>` : ""}
    </div>

    ${damageBlock}

    ${opts.note ? `<div class="gl-card-detail">${esc(opts.note)}</div>` : ""}

    ${opts.deviation ? `<div class="gl-card-detail"><em>⚠ ${esc(opts.deviation)}</em></div>` : ""}

    ${
      actionButtons.length
        ? `<div class="gl-card-actions">${actionButtons.join("\n             ")}</div>`
        : ""
    }
  </div>`;
}

// Kept as a compatibility reference while old message markup remains readable.
void rollCardHTMLLegacy;

/** Build the art-led roll card selected in the visual design pass. */
export function rollCardHTML(opts: RollCardOptions): string {
  const { result } = opts;
  const openEnded = result.difficulty <= 0;
  const potentialBestial = openEnded && result.won && result.hungerOnes > 0;
  const showBadge = !openEnded || !["success", "failure"].includes(result.outcome);
  const badge = OUTCOME_LABEL[result.outcome] ?? "Result";
  const vsLine = openEnded
    ? ""
    : `<span class="gl-vs">vs Difficulty ${result.difficulty}</span>`;
  const critNote = result.critPairs > 0
    ? `<span class="gl-crit-note">+${result.bonusSuccesses} from ${result.critPairs} critical pair${result.critPairs > 1 ? "s" : ""}</span>`
    : "";
  const canReroll = !result.willpowerUsed && result.dice.some((d) => !d.hunger && !d.rerolled);
  const plural = (n: number, word: string) =>
    `${n} ${n === 1 ? word : word === "success" ? "successes" : `${word}s`}`;

  let damageBlock = "";
  const showDamage = !!opts.weapon && result.won;
  if (opts.weapon && showDamage) {
    const damage = weaponDamageTotal(result, opts.weapon);
    damageBlock = `<div class="gl-card-damage">
      <span class="gl-dmg-total"><b>${damage}</b> ${esc(opts.weapon.damageType)} damage</span>
      <span class="gl-dmg-calc">margin ${result.margin} + ${esc(opts.weapon.name)} ${opts.weapon.damage}${result.margin + opts.weapon.damage < 1 ? " (min 1)" : ""}</span>
    </div>`;
  }

  const actionButtons: string[] = [];
  if (opts.showCompulsion) {
    actionButtons.push(`<button type="button" class="gl-act gl-act-primary gl-act-compulsion" data-gl-action="compulsion">Compulsion&hellip;</button>`);
  }
  if (showDamage) {
    actionButtons.push(`<button type="button" class="gl-act gl-act-primary" data-gl-action="apply-damage">Apply Damage</button>`);
  }
  if (canReroll) {
    const primary = actionButtons.length === 0 ? " gl-act-primary" : "";
    actionButtons.push(`<button type="button" class="gl-act${primary}" data-gl-action="wp-reroll">Willpower Re-roll</button>`);
  }

  const resultLabel = showBadge ? badge : result.successes === 1 ? "Success" : "Successes";
  const tally = `<div class="gl-card-tally gl-out-${result.outcome}">
    <div class="gl-tally-num"><b>${result.successes}</b></div>
    <div class="gl-tally-copy">
      <span class="gl-tally-result"><span class="gl-badge">${resultLabel}</span>${vsLine}</span>
      <span class="gl-tally-pool">${esc(opts.flavor)}</span>
    </div>
  </div>`;
  const hero = cardHeroHTML({
    actorName: opts.actorName,
    flavor: "",
    img: opts.img,
    artTransform: opts.artTransform,
    minimal: true,
    overlay: tally,
  });

  const meta = [
    critNote,
    result.hungerOnes > 0 ? `<span class="gl-bane-note">${plural(result.hungerOnes, "Hunger&nbsp;1")}</span>` : "",
    result.messy ? `<span class="gl-bane-note">Messy</span>` : "",
  ].filter(Boolean).join("");

  return `<div class="gl-card ${opts.bloodSurge ? "gl-surge" : ""}" data-outcome="${result.outcome}">
    ${opts.bloodSurge ? `<div class="gl-surge-band" aria-hidden="true"></div>` : ""}
    ${hero}
    ${opts.bloodSurge ? `<div class="gl-surge-tag">Blood Surge &mdash; Rouse the Blood</div>` : ""}
    ${potentialBestial ? `<div class="gl-bestial-warn">&#9888; Potential Bestial Failure</div>` : ""}
    ${diceRow(result)}
    <div class="gl-card-body">
      ${meta ? `<div class="gl-card-meta">${meta}</div>` : ""}
      ${damageBlock}
      ${opts.note ? `<div class="gl-card-detail">${esc(opts.note)}</div>` : ""}
      ${opts.deviation ? `<div class="gl-card-detail"><em>&#9888; ${esc(opts.deviation)}</em></div>` : ""}
      ${actionButtons.length ? `<div class="gl-card-actions">${actionButtons.join("\n")}</div>` : ""}
    </div>
  </div>`;
}

/** Post a standard pool roll as a chat message carrying the Foundry Roll (DSN). */
export async function postRollCard(
  actor: any,
  result: V5RollResult,
  roll: any,
  opts: {
    flavor?: string;
    bloodSurge?: boolean;
    note?: string;
    /** ChatMessage id of the request card this roll fulfils, if any. */
    requestMessageId?: string;
    /** Human note when the rolled pool deviated from the requested one. */
    deviation?: string;
    /** Force the card public regardless of the user's chat roll-mode. */
    forcePublic?: boolean;
    /** Weapon context: shows the damage summary + Apply Damage on a win. */
    weapon?: WeaponRollInfo;
  } = {},
): Promise<any> {
  const flavor = opts.flavor ?? "Roll";
  const img = actor?.img;
  const artTransform = actorChatArt(actor);
  const showCompulsion = compulsionEligible(actor, result);
  const content = rollCardHTML({
    actorName: actor?.name ?? "—",
    img,
    artTransform,
    result,
    flavor,
    bloodSurge: opts.bloodSurge,
    note: opts.note,
    deviation: opts.deviation,
    weapon: opts.weapon,
    showCompulsion,
  });
  const data: Record<string, any> = {
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [roll],
    flags: {
      [SYSTEM_ID]: {
        card: "roll",
        result,
        actorUuid: actor?.uuid,
        actorName: actor?.name,
        img,
        artTransform,
        flavor,
        bloodSurge: !!opts.bloodSurge,
        requestMessageId: opts.requestMessageId,
        deviation: opts.deviation,
        weapon: opts.weapon,
      },
    },
  };
  // Request-driven rolls are always public: pin the roll-mode to publicroll and
  // clear any whisper/blind so the user's private roll-mode can't hide the card.
  if (opts.forcePublic) {
    // The ambient shim doesn't declare CONST; the literal is stable across v13.
    data.rollMode = (globalThis as any).CONST?.DICE_ROLL_MODES?.PUBLIC ?? "publicroll";
    data.whisper = [];
    data.blind = false;
  }
  return await ChatMessage.create(data);
}

export interface CheckCardData {
  kind: "rouse" | "remorse" | "frenzy";
  title: string;
  success: boolean;
  dice: number[];
  detail: string;
  roll: any;
  img?: string;
}

/**
 * Resolve once Dice So Nice has finished animating a message's roll — or
 * immediately when DSN is absent. Callers hold visible actor mutations on this
 * so trackers (Hunger, Humanity) can't spoil a result mid-tumble.
 */
export async function waitForDiceAnimation(message: any): Promise<void> {
  const dice3d = (game as any).dice3d;
  if (!dice3d?.waitFor3DAnimationByMessageID || !message?.id) return;
  try {
    await dice3d.waitFor3DAnimationByMessageID(message.id);
  } catch {
    // Never let a hiccup in the animation strand the roll's bookkeeping.
  }
}

/** Post a single-purpose check (Rouse / Remorse / Frenzy) card. */
async function postCheckCardLegacy(actor: any, data: CheckCardData): Promise<any> {
  const chips = data.dice
    .map((v, i) => dieChip(v, data.kind === "rouse" ? "rouse" : "regular", false, i))
    .join("");
  const img = data.img ?? actor?.img;
  const portrait = img
    ? `<img class="gl-card-portrait" src="${esc(img)}" alt="" onerror="this.style.display='none'"/>`
    : "";
  const content = `
  <div class="gl-card gl-check" data-outcome="${data.success ? "success" : "failure"}">
    <div class="gl-card-head">
      ${portrait}
      <div class="gl-card-id">
        <span class="gl-card-actor">${esc(actor?.name ?? "—")}</span>
        <span class="gl-card-flavor">${esc(data.title)}</span>
      </div>
    </div>
    <div class="gl-card-tally ${data.success ? "gl-out-success" : "gl-out-failure"}">
      <div class="gl-tally-badge"><span class="gl-badge">${data.success ? "Success" : "Failure"}</span></div>
    </div>
    <div class="gl-dice">${chips}</div>
    <div class="gl-card-detail">${esc(data.detail)}</div>
  </div>`;
  return await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [data.roll],
    flags: { [SYSTEM_ID]: { card: data.kind } },
  });
}

void postCheckCardLegacy;

/** Post an art-led Rouse / Remorse / Frenzy check card. */
export async function postCheckCard(actor: any, data: CheckCardData): Promise<any> {
  const chips = data.dice
    .map((value, index) => dieChip(value, data.kind === "rouse" ? "rouse" : "regular", false, index))
    .join("");
  const img = data.img ?? actor?.img;
  const tally = `<div class="gl-card-tally ${data.success ? "gl-out-success" : "gl-out-failure"}">
    <div class="gl-tally-badge"><span class="gl-badge">${data.success ? "Success" : "Failure"}</span></div>
  </div>`;
  const hero = cardHeroHTML({
    actorName: actor?.name ?? "—",
    flavor: data.title,
    img,
    artTransform: actorChatArt(actor),
    compact: true,
    overlay: tally,
  });
  const content = `<div class="gl-card gl-check" data-outcome="${data.success ? "success" : "failure"}">
    ${hero}
    <div class="gl-dice">${chips}</div>
    <div class="gl-card-body">
      <div class="gl-card-detail">${esc(data.detail)}</div>
    </div>
  </div>`;
  return await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [data.roll],
    flags: { [SYSTEM_ID]: { card: data.kind } },
  });
}
