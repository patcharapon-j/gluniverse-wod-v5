/**
 * Oblivion Ceremonies compendium (levels 1–5).
 *
 * Core Oblivion ceremonies plus additions from Cults of the Blood Gods and
 * Blood Sigils. Ceremony level and casting pool are mechanical facts;
 * descriptions are original one-line summaries. `source` names the book.
 */

import { Ceremony } from "./_helpers.mjs";

export default [
  // Level 1
  Ceremony({ level: 1, name: "Where the Shroud Thins", ingredients: "Grave dirt or a memento of the dead", desc: "Sense and briefly perceive the ghosts lingering in a place." }),
  Ceremony({ level: 1, name: "Knowing Stone", ingredients: "A stone anointed with the caster's Vitae", desc: "Enchant a stone that points the way toward a specific known ghost." }),
  Ceremony({ level: 1, name: "Eyes of the Dead", ingredients: "The eyes of a corpse", desc: "Glimpse the final moments a dead body witnessed before death." }),
  Ceremony({ level: 1, name: "Gift of False Life", ingredients: "A fresh corpse and the caster's Vitae", source: "Cults of the Blood Gods", desc: "Animate corpses to perform simple, repetitive tasks." }),
  Ceremony({ level: 1, name: "Summon Spirit", ingredients: "An object the ghost is tied to", source: "Cults of the Blood Gods", desc: "Call a wraith bound to its fetter into your presence." }),

  // Level 2
  Ceremony({ level: 2, name: "Compel Spirit", ingredients: "A token binding the ghost to the site", desc: "Issue a brief, binding command to a nearby ghost." }),
  Ceremony({ level: 2, name: "Ashes to Ashes", ingredients: "Quicklime and the caster's Vitae", desc: "Reduce a mortal corpse to fine ash within minutes." }),
  Ceremony({ level: 2, name: "Awaken the Homuncular Servant", ingredients: "A body part or a small dead animal", source: "Cults of the Blood Gods", desc: "Craft a tiny homunculus spy from scraps of the dead." }),

  // Level 3
  Ceremony({ level: 3, name: "Host Spirit", ingredients: "The caster's own blood offered to the ghost", desc: "Invite a ghost to ride within the caster's body as a passenger." }),
  Ceremony({ level: 3, name: "Bind the Spirit", ingredients: "An object tied to the ghost in life", desc: "Chain a ghost into an object or place to compel its service." }),
  Ceremony({ level: 3, name: "Wisdom of the Dead", ingredients: "A skull or severed head", source: "Cults of the Blood Gods", desc: "Wring skills or answers from the skull of the dead." }),
  Ceremony({ level: 3, name: "Harrowhaunt", ingredients: "Grave earth spread across a threshold", source: "Blood Sigils", desc: "Steep an area so intruding mortals are struck with dread." }),
  Ceremony({ level: 3, name: "Knit the Veil", ingredients: "A ceremonial candle", source: "Blood Sigils", desc: "Seal tears in the Shroud while the candle burns." }),
  Ceremony({ level: 3, name: "Fortezza Sindonica", ingredients: "A consecrated cloth and Vitae", source: "Blood Sigils", desc: "Raise a ward that traps and harms wraiths in an area." }),

  // Level 4
  Ceremony({ level: 4, name: "Blood of the Grave", ingredients: "Blood drawn beside a fresh corpse", desc: "Draw sustaining, uncanny power from proximity to the dead." }),
  Ceremony({ level: 4, name: "Split the Shroud", ingredients: "A blade wetted with Vitae", desc: "Tear a temporary opening to the land of the dead." }),
  Ceremony({ level: 4, name: "Ex Nihilo", ingredients: "A threshold marked in Vitae", source: "Cults of the Blood Gods", desc: "Step bodily across into the realm of the dead." }),
  Ceremony({ level: 4, name: "Mental Maze", ingredients: "A knotted cord and Vitae", source: "Cults of the Blood Gods", desc: "Trap a victim's mind in a disorienting labyrinth." }),

  // Level 5
  Ceremony({ level: 5, name: "The Skin Trade", ingredients: "The prepared skin of a corpse", desc: "Wear the shape and semblance of a specific dead body." }),
  Ceremony({ level: 5, name: "Lazarene Blessing", ingredients: "A corpse and a generous offering of Vitae", desc: "Raise and briefly animate a corpse as an obedient servant." }),
  Ceremony({ level: 5, name: "Pit of Contemplation", ingredients: "A sealed vessel and grave earth", source: "Cults of the Blood Gods", desc: "Imprison a soul or spirit in confinement." }),
  Ceremony({ level: 5, name: "Shatter", ingredients: "A cracked mirror and Vitae", source: "Cults of the Blood Gods", desc: "Unmake a targeted spirit, tearing it apart." }),
];
