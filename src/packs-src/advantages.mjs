/**
 * Advantages compendium — Backgrounds, Merits, Flaws, and Loresheets.
 *
 * Category (kind) and dot range are mechanical facts; descriptions are original
 * one-line summaries. `value` is the entry's default/first dot, `maxValue` the
 * top of its range.
 */

import { Adv } from "./_helpers.mjs";

const bg = (name, max, desc) => Adv({ kind: "background", name, value: 1, maxValue: max, desc });
const merit = (name, min, max, desc) => Adv({ kind: "merit", name, value: min, maxValue: max, desc });
const flaw = (name, min, max, desc) => Adv({ kind: "flaw", name, value: min, maxValue: max, desc });
const lore = (name, desc) => Adv({ kind: "loresheet", name, value: 1, maxValue: 5, desc });

export default [
  /* --- Backgrounds ------------------------------------------------------ */
  bg("Allies", 5, "Mortals who will help and act on your behalf out of loyalty."),
  bg("Contacts", 5, "Sources who provide information, goods, or introductions."),
  bg("Fame", 5, "Public renown that opens doors and draws attention."),
  bg("Haven", 5, "A secure resting place; higher dots mean better security and amenities."),
  bg("Herd", 5, "A dependable pool of mortals to feed from safely."),
  bg("Influence", 5, "Sway over a sphere of mortal society or institutions."),
  bg("Mask", 2, "A fabricated mortal identity with supporting paperwork."),
  bg("Mawla", 5, "An experienced Kindred mentor you can call on for aid or advice."),
  bg("Resources", 5, "Personal wealth, assets, and disposable income."),
  bg("Retainers", 5, "Devoted servants — ghouls or thralls — bound to your service."),
  bg("Status", 5, "Standing and reputation within Kindred society."),

  /* --- Merits ----------------------------------------------------------- */
  merit("Beautiful", 2, 2, "Your striking looks grant a bonus to relevant social rolls."),
  merit("Stunning", 4, 4, "Extraordinary beauty grants a larger bonus to social rolls."),
  merit("Bloodhound", 1, 1, "You can smell traits of blood — Resonance and more — by scent."),
  merit("Iron Gullet", 3, 3, "You can feed on old, rancid, or cold stored blood without trouble."),
  merit("Eat Food", 2, 2, "You can consume and appear to enjoy ordinary food and drink."),
  merit("Linguistics", 1, 5, "You are fluent in one additional language per dot."),
  merit("Common Sense", 1, 1, "The Storyteller flags obviously bad ideas before you commit."),
  merit("Untouchable", 5, 5, "You can escape official notice for even serious Masquerade breaches."),
  merit("Zealotry", 1, 3, "Faith steadies you; reroll certain checks tied to your conviction."),
  merit("Unholy Will", 2, 4, "Your ties to dark powers strengthen supernatural resistance."),

  /* --- Flaws ------------------------------------------------------------ */
  flaw("Ugly", 1, 1, "Your unfortunate looks impose a penalty on relevant social rolls."),
  flaw("Repulsive", 2, 2, "Deeply off-putting appearance imposes a larger social penalty."),
  flaw("Prey Exclusion", 1, 1, "You refuse to feed from a chosen type of victim, risking Hunger."),
  flaw("Farmer", 2, 2, "You are loath to feed on humans and must feed on animals when able."),
  flaw("Organovore", 2, 2, "You must consume flesh or organs, not merely blood, to be sated."),
  flaw("Methuselah's Thirst", 1, 1, "Ordinary blood no longer fully satisfies your ancient Hunger."),
  flaw("Stake Bait", 2, 2, "Rivals particularly wish you gone; you are a frequent target."),
  flaw("Bond Junkie", 1, 1, "You are especially susceptible to the pull of the Blood Bond."),
  flaw("Prey Exclusion (Children)", 1, 1, "You will not feed on the young, whatever the cost."),
  flaw("Illiterate", 2, 2, "You cannot read or write, barring related knowledge rolls."),

  /* --- Loresheets ------------------------------------------------------- */
  lore("Cainite Heresy", "Ties to the secret vampiric heresy that reveres Caine as a dark messiah."),
  lore("Golconda", "A pursuit of the fabled state of balance between the Beast and humanity."),
  lore("The Ashfinders", "Connection to Kindred who study — and chase — the mystery of diablerie and torpor."),
  lore("Descendant of Hardestadt", "Lineage tied to the storied Ventrue elder and his legacy."),
  lore("Theo Bell", "Association with the famous Brujah rebel and his cause."),
];
