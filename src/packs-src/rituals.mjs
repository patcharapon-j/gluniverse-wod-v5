/**
 * Blood Sorcery Rituals compendium (levels 1–5).
 *
 * Core Rulebook rituals plus additions from across the V5 line (Players Guide,
 * Blood Sigils, Chicago by Night / Folios, Sabbat, Fall of London, Forbidden
 * Religions). Ritual level, casting pool, and required ingredients are
 * mechanical facts; descriptions are original one-line summaries. `source`
 * names the book (default Core / V5).
 */

import { Ritual } from "./_helpers.mjs";

export default [
  // Level 1
  Ritual({ level: 1, name: "Blood Walk", ingredients: "A mouthful of the subject's blood", desc: "Read a taste of Kindred blood to learn the subject's name, sire, and lineage." }),
  Ritual({ level: 1, name: "Clinging of the Insect", ingredients: "A living spider", desc: "Grant the caster the ability to climb walls and ceilings like an insect." }),
  Ritual({ level: 1, name: "Craft Bloodstone", ingredients: "A small stone soaked in Vitae", desc: "Enchant a stone the caster can always sense the direction and distance of." }),
  Ritual({ level: 1, name: "Wake with Evening's Freshness", ingredients: "A feather burned to ash", desc: "Wake instantly and alert at the first sign of danger during the day's sleep." }),
  Ritual({ level: 1, name: "Ward Against Ghouls", ingredients: "Caster's Vitae drawn as a sigil", desc: "Inscribe a sigil that painfully repels ghouls who touch it." }),
  Ritual({ level: 1, name: "Astromancy", ingredients: "The caster's blood cast as a chart", source: "Blood Sigils", desc: "Read a target's aptitudes and driving Ambition in patterns of blood." }),
  Ritual({ level: 1, name: "Bind the Accusing Tongue", ingredients: "A lock of the target's hair", source: "Blood Sigils", desc: "Curse a target so they cannot speak ill of the caster." }),
  Ritual({ level: 1, name: "Blood to Water", ingredients: "A vessel of blood", source: "Blood Sigils", desc: "Transmute a quantity of blood harmlessly into water." }),
  Ritual({ level: 1, name: "Enrich the Blood", ingredients: "Herbs steeped in Vitae", source: "Players Guide", desc: "Raise the nourishment a draught of mortal blood provides." }),

  // Level 2
  Ritual({ level: 2, name: "Communicate with Kindred Sire", ingredients: "The caster's own Vitae", desc: "Open a brief one-way channel of communication toward the caster's sire." }),
  Ritual({ level: 2, name: "Eyes of Babel", ingredients: "The tongue and an eye of a polyglot", desc: "Temporarily understand and speak languages known to the consumed victim." }),
  Ritual({ level: 2, name: "Truth of Blood", ingredients: "Blood of the one to be questioned", desc: "Compel honest answers from a subject whose blood the caster prepares." }),
  Ritual({ level: 2, name: "Warding Circle Against Ghouls", ingredients: "A ring of the caster's Vitae", desc: "Lay a circle ghouls cannot cross without suffering." }),
  Ritual({ level: 2, name: "Ward Against Spirits", ingredients: "Salt and the caster's Vitae", desc: "Inscribe a sigil that repels ghosts and spirits." }),
  Ritual({ level: 2, name: "Calix Secretus", ingredients: "A hand-sized object and Vitae", source: "Players Guide", desc: "Turn an object into a hidden vessel that stores blood." }),
  Ritual({ level: 2, name: "Soporific Touch", ingredients: "A dose of the caster's Vitae", source: "Blood Sigils", desc: "Make your Vitae narcotic, leaving a drinker drowsy and suggestible." }),
  Ritual({ level: 2, name: "Depths of Nightmare", ingredients: "A drop of the sleeper's blood", source: "Blood Sigils", desc: "Plague a target's rest with vivid, exhausting nightmares." }),

  // Level 3
  Ritual({ level: 3, name: "Dagon's Call", ingredients: "A drop of the target's blood, previously tasted", desc: "Rupture blood vessels in a victim the caster has tasted, at a distance." }),
  Ritual({ level: 3, name: "Deflection of Wooden Doom", ingredients: "A splinter of wood, snapped", desc: "Ward the caster against the first stake that would find their heart." }),
  Ritual({ level: 3, name: "Firewalker", ingredients: "A pinch of ash from a great fire", desc: "Halve the danger and terror that fire holds for the caster for a scene." }),
  Ritual({ level: 3, name: "Illuminate the Trail of Prey", ingredients: "An article belonging to the quarry", desc: "Reveal a glowing trail marking where a chosen quarry has recently passed." }),
  Ritual({ level: 3, name: "Warding Circle Against Spirits", ingredients: "Salt and a ring of Vitae", desc: "Lay a circle that repels ghosts and spirits from an area." }),
  Ritual({ level: 3, name: "Ward Against Lupines", ingredients: "The blood or fur of a werewolf", desc: "Inscribe a sigil that harms werewolves who touch it." }),
  Ritual({ level: 3, name: "Bladed Hands", ingredients: "A blade dulled and consumed", source: "The Chicago Folios", desc: "Harden the hands into edges that deal Aggravated damage." }),
  Ritual({ level: 3, name: "Eyes of the Past", ingredients: "A ground lens and Vitae", source: "The Chicago Folios", desc: "View events that unfolded at a location in the past." }),
  Ritual({ level: 3, name: "Sanguine Watcher", ingredients: "The caster's Vitae given to a rat", source: "The Chicago Folios", desc: "Bind a rat from Vitae as a loyal spy and messenger." }),
  Ritual({ level: 3, name: "Illusion of Peaceful Death", ingredients: "Grave earth and Vitae", source: "The Chicago Folios", desc: "Make a corpse appear to have died a quiet, natural death." }),
  Ritual({ level: 3, name: "Galvanic Ruination", ingredients: "A copper coin", source: "Sabbat", desc: "Overload and short out electrical wiring and devices nearby." }),
  Ritual({ level: 3, name: "Nepenthe", ingredients: "A brewed draught of Vitae", source: "Blood Sigils", desc: "Dull or erase a chosen memory in the one who drinks it." }),

  // Level 4
  Ritual({ level: 4, name: "Defense of the Sacred Haven", ingredients: "Vitae smeared on the haven's threshold", desc: "Shield a chosen resting place from the killing light of the sun." }),
  Ritual({ level: 4, name: "Eyes of the Nighthawk", ingredients: "A bird of prey, bound", desc: "See through the eyes of birds the caster has prepared." }),
  Ritual({ level: 4, name: "Incorporeal Passage", ingredients: "A shard of mirror", desc: "Step into an intangible state, passing through solid barriers for a time." }),
  Ritual({ level: 4, name: "Ward Against Cainites", ingredients: "A vial of another vampire's Vitae", desc: "Inscribe a sigil that harms Kindred who touch it." }),
  Ritual({ level: 4, name: "Splinter Servant", ingredients: "A carved wooden stake", desc: "Animate a stake to hunt and strike at a chosen target on its own." }),
  Ritual({ level: 4, name: "Warding Circle Against Cainites", ingredients: "A ring drawn in vampire Vitae", desc: "Lay a circle that repels and injures other Kindred." }),
  Ritual({ level: 4, name: "Feast of Ashes", ingredients: "The ashes of a destroyed vampire", source: "Players Guide", desc: "Draw uncanny sustenance from the ashes of the dead." }),

  // Level 5
  Ritual({ level: 5, name: "Escape to a True Friend", ingredients: "Ash and a token of a trusted ally", desc: "Instantly transport the caster to the side of a deeply trusted ally." }),
  Ritual({ level: 5, name: "Heart of Stone", ingredients: "A stone shaped like a heart", desc: "Turn the caster's heart to stone, immune to staking but numb to emotion." }),
  Ritual({ level: 5, name: "Shaft of Belated Dissolution", ingredients: "A hawthorn stake carved with sigils", desc: "Curse a stake so that a struck vampire crumbles even if it is later removed." }),
  Ritual({ level: 5, name: "Antebrachia Ignium", ingredients: "Charred wood and Vitae", source: "Players Guide", desc: "Wreathe the caster's forearms in conjured flame." }),
  Ritual({ level: 5, name: "Eden's Bounty", ingredients: "A vessel of consecrated Vitae", source: "Players Guide", desc: "Call forth an abundance of restorative Vitae for the faithful." }),
];
