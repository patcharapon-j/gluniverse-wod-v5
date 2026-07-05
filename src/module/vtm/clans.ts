/**
 * Clan reference data: in-clan Disciplines, and each clan's Bane and Compulsion.
 *
 * Bane / Compulsion strings are original one-line mechanical summaries written
 * for this system — they capture *what the rule does* (dice penalties, feeding
 * restrictions, frenzy hooks) without reproducing any rulebook prose. The actual
 * Bane Severity a penalty scales to comes from the Blood Potency table
 * (see {@link ../config.ts BLOOD_POTENCY}).
 */

import type { Clan, Discipline } from "../config.ts";

export interface ClanInfo {
  /** The three in-clan Disciplines (cheaper to raise, used by the XP engine). */
  disciplines: Discipline[];
  /** Original one-line summary of the clan Bane's mechanical effect. */
  bane: string;
  /** Original one-line summary of the clan Compulsion. */
  compulsion: string;
}

export const CLAN_INFO: Record<Clan, ClanInfo> = {
  brujah: {
    disciplines: ["celerity", "potence", "presence"],
    bane: "Subtract Bane Severity from rolls made to resist a fury frenzy.",
    compulsion: "Rebellion — act against a leader, faction, or the last order given.",
  },
  gangrel: {
    disciplines: ["animalism", "fortitude", "protean"],
    bane: "In frenzy, gain Bane Severity animal features that persist and impose matching penalties.",
    compulsion: "Feral Impulses — drop to instinct: penalties to non-physical and social pools.",
  },
  malkavian: {
    disciplines: ["auspex", "dominate", "obfuscate"],
    bane: "Suffer Bane Severity to one chosen category of pools while the clan curse is active.",
    compulsion: "Delusion — perception fractures: penalties to rolls relying on read reality.",
  },
  nosferatu: {
    disciplines: ["animalism", "obfuscate", "potence"],
    bane: "Cannot benefit from positive social pools (except Intimidation); count Bane Severity as failed on breach.",
    compulsion: "Cryptophilia — obsessively hoard and withhold secrets.",
  },
  toreador: {
    disciplines: ["auspex", "celerity", "presence"],
    bane: "Faced with striking beauty, take Bane Severity to all pools until you disengage.",
    compulsion: "Obsession — fixate on a thing of beauty; penalties to anything else.",
  },
  tremere: {
    disciplines: ["auspex", "dominate", "bloodSorcery"],
    bane: "Your thinned blood binds others slowly — bonds you create need extra drinks equal to Bane Severity.",
    compulsion: "Perfectionism — redo work; a penalty that halves on a repeated attempt.",
  },
  ventrue: {
    disciplines: ["dominate", "fortitude", "presence"],
    bane: "Feed only from a preferred vessel; otherwise spend Willpower or the Blood is refused.",
    compulsion: "Arrogance — force obedience; penalties to pools that aren't about command.",
  },
  banuHaqim: {
    disciplines: ["bloodSorcery", "celerity", "obfuscate"],
    bane: "Slake more than one Hunger from a mortal and roll to resist the urge to drain them; diablerie tempts.",
    compulsion: "Judgment — slake at least one Hunger from a transgressor, or take a penalty.",
  },
  hecata: {
    disciplines: ["auspex", "fortitude", "oblivion"],
    bane: "Your Kiss brings pain, not ecstasy — vessels resist and the feeding is never soothing.",
    compulsion: "Morbidity — dwell on death; penalties until you resolve a mortal matter grimly.",
  },
  lasombra: {
    disciplines: ["dominate", "oblivion", "potence"],
    bane: "Mirrors and recordings distort you; on a messy or high-Hunger action, technology also glitches.",
    compulsion: "Ruthlessness — take the direct, dominant path; penalties on a failed attempt otherwise.",
  },
  ministry: {
    disciplines: ["obfuscate", "presence", "protean"],
    bane: "Deprived of an indulgence, or under light, take Bane Severity extra harm / penalty.",
    compulsion: "Transgression — tempt someone across a personal boundary.",
  },
  ravnos: {
    disciplines: ["animalism", "obfuscate", "presence"],
    bane: "Day-sleeping in the same place twice risks Bane Severity aggravated damage.",
    compulsion: "Tempting Fate — take the most dangerous route to a goal.",
  },
  salubri: {
    disciplines: ["auspex", "dominate", "fortitude"],
    bane: "Your Kiss is addictive and your Blood is coveted — feeding risks exposing the third eye.",
    compulsion: "Affective Empathy — feel another's pain; penalties until you help or feed them.",
  },
  tzimisce: {
    disciplines: ["animalism", "dominate", "protean"],
    bane: "Bind a domain or possession; rest away from it and take Bane Severity to all pools.",
    compulsion: "Covetousness — possess or control the object of your attention.",
  },
  caitiff: {
    disciplines: [],
    bane: "No clan Bane, but every Discipline costs as out-of-clan and status is hard-won.",
    compulsion: "None — the clanless answer only to their own Beast.",
  },
  thinBlood: {
    disciplines: [],
    bane: "Barely undead — most clan weaknesses are muted, but so are the Blood's gifts.",
    compulsion: "None — Thin-Blood Alchemy replaces a fixed clan curse.",
  },
};

/**
 * A single Compulsion the Storyteller may impose after a Bestial Failure or
 * Messy Critical. `summary` is an original one-line mechanical description of
 * what the Compulsion drives the character to do and the penalty for resisting.
 */
export interface CompulsionInfo {
  id: string;
  name: string;
  summary: string;
}

/**
 * The four general Compulsions available to any vampire regardless of clan.
 * Each persists until satisfied; while resisting or acting against it the
 * character takes a two-die penalty to any pool unrelated to indulging it.
 */
export const GENERAL_COMPULSIONS: CompulsionInfo[] = [
  {
    id: "hunger",
    name: "Hunger",
    summary:
      "Must attempt to feed at the first opportunity; two-die penalty on any pool that isn't about slaking Hunger, until you have fed.",
  },
  {
    id: "dominance",
    name: "Dominance",
    summary:
      "Must assert dominance and one-up those around you; two-die penalty on any pool not spent putting someone in their place, until you have.",
  },
  {
    id: "harm",
    name: "Harm",
    summary:
      "Must inflict physical or emotional harm on those nearby; two-die penalty on any pool that isn't about causing suffering, until harm is done.",
  },
  {
    id: "paranoia",
    name: "Paranoia",
    summary:
      "Must escape perceived danger and treat everyone as a threat; two-die penalty on any pool not spent hiding or fleeing, until you feel safe.",
  },
];

/** Look up a general Compulsion by id. */
export function generalCompulsion(id: string): CompulsionInfo | undefined {
  return GENERAL_COMPULSIONS.find((c) => c.id === id);
}

/**
 * The clan's specific Compulsion as a {@link CompulsionInfo}, id `clan:<clan>`.
 * Returns undefined for clans without one (Caitiff, Thin-blood).
 */
export function clanCompulsionInfo(clan: string): CompulsionInfo | undefined {
  const info = CLAN_INFO[clan as Clan];
  if (!info || !info.compulsion || info.compulsion.startsWith("None")) return undefined;
  // The stored string is "Name — mechanical summary"; split the display name off.
  const dash = info.compulsion.indexOf("—");
  const name = dash >= 0 ? info.compulsion.slice(0, dash).trim() : info.compulsion.trim();
  const summary = dash >= 0 ? info.compulsion.slice(dash + 1).trim() : info.compulsion.trim();
  return { id: `clan:${clan}`, name, summary };
}

/** In-clan Disciplines for XP-cost purposes (empty = treat all as out-of-clan). */
export function inClanDisciplines(clan: string): Discipline[] {
  return CLAN_INFO[clan as Clan]?.disciplines ?? [];
}

export function clanBane(clan: string): string {
  return CLAN_INFO[clan as Clan]?.bane ?? "";
}

export function clanCompulsion(clan: string): string {
  return CLAN_INFO[clan as Clan]?.compulsion ?? "";
}
