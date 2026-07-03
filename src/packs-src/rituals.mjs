/**
 * Blood Sorcery Rituals compendium (levels 1–5).
 *
 * Ritual level, casting pool, and required ingredients are mechanical facts;
 * descriptions are original one-line summaries of the ritual's effect.
 */

import { Ritual } from "./_helpers.mjs";

export default [
  // Level 1
  Ritual({ level: 1, name: "Blood Walk", ingredients: "A mouthful of the subject's blood", desc: "Read a taste of Kindred blood to learn the subject's name, sire, and lineage." }),
  Ritual({ level: 1, name: "Clinging of the Insect", ingredients: "A living spider", desc: "Grant the caster the ability to climb walls and ceilings like an insect." }),
  Ritual({ level: 1, name: "Craft Bloodstone", ingredients: "A small stone soaked in Vitae", desc: "Enchant a stone the caster can always sense the direction and distance of." }),
  Ritual({ level: 1, name: "Wake with Evening's Freshness", ingredients: "A feather burned to ash", desc: "Wake instantly and alert at the first sign of danger during the day's sleep." }),
  Ritual({ level: 1, name: "Ward Against Ghouls", ingredients: "Caster's Vitae drawn as a sigil", desc: "Inscribe a sigil that painfully repels ghouls who touch it." }),

  // Level 2
  Ritual({ level: 2, name: "Communicate with Kindred Sire", ingredients: "The caster's own Vitae", desc: "Open a brief one-way channel of communication toward the caster's sire." }),
  Ritual({ level: 2, name: "Eyes of Babel", ingredients: "The tongue and an eye of a polyglot", desc: "Temporarily understand and speak languages known to the consumed victim." }),
  Ritual({ level: 2, name: "Truth of Blood", ingredients: "Blood of the one to be questioned", desc: "Compel honest answers from a subject whose blood the caster prepares." }),
  Ritual({ level: 2, name: "Warding Circle Against Ghouls", ingredients: "A ring of the caster's Vitae", desc: "Lay a circle ghouls cannot cross without suffering." }),

  // Level 3
  Ritual({ level: 3, name: "Dagon's Call", ingredients: "A drop of the target's blood, previously tasted", desc: "Rupture blood vessels in a victim the caster has tasted, at a distance." }),
  Ritual({ level: 3, name: "Deflection of Wooden Doom", ingredients: "A splinter of wood, snapped", desc: "Ward the caster against the first stake that would find their heart." }),
  Ritual({ level: 3, name: "Firewalker", ingredients: "A pinch of ash from a great fire", desc: "Halve the danger and terror that fire holds for the caster for a scene." }),
  Ritual({ level: 3, name: "Illuminate the Trail of Prey", ingredients: "An article belonging to the quarry", desc: "Reveal a glowing trail marking where a chosen quarry has recently passed." }),
  Ritual({ level: 3, name: "Ward Against Spirits", ingredients: "Salt and the caster's Vitae", desc: "Inscribe a sigil that repels ghosts and spirits." }),

  // Level 4
  Ritual({ level: 4, name: "Defense of the Sacred Haven", ingredients: "Vitae smeared on the haven's threshold", desc: "Shield a chosen resting place from the killing light of the sun." }),
  Ritual({ level: 4, name: "Eyes of the Nighthawk", ingredients: "A bird of prey, bound", desc: "See through the eyes of birds the caster has prepared." }),
  Ritual({ level: 4, name: "Incorporeal Passage", ingredients: "A shard of mirror", desc: "Step into an intangible state, passing through solid barriers for a time." }),

  // Level 5
  Ritual({ level: 5, name: "Escape to a True Friend", ingredients: "Ash and a token of a trusted ally", desc: "Instantly transport the caster to the side of a deeply trusted ally." }),
  Ritual({ level: 5, name: "Heart of Stone", ingredients: "A stone shaped like a heart", desc: "Turn the caster's heart to stone, immune to staking but numb to emotion." }),
  Ritual({ level: 5, name: "Shaft of Belated Dissolution", ingredients: "A hawthorn stake carved with sigils", desc: "Curse a stake so that a struck vampire crumbles even if it is later removed." }),
];
