/**
 * Oblivion Ceremonies compendium (levels 1–5).
 *
 * Ceremony level and casting pool are mechanical facts; descriptions are
 * original one-line summaries of each ceremony's effect.
 */

import { Ceremony } from "./_helpers.mjs";

export default [
  // Level 1
  Ceremony({ level: 1, name: "Where the Shroud Thins", ingredients: "Grave dirt or a memento of the dead", desc: "Sense and briefly perceive the ghosts lingering in a place." }),
  Ceremony({ level: 1, name: "Knowing Stone", ingredients: "A stone anointed with the caster's Vitae", desc: "Enchant a stone that points the way toward a specific known ghost." }),
  Ceremony({ level: 1, name: "Eyes of the Dead", ingredients: "The eyes of a corpse", desc: "Glimpse the final moments a dead body witnessed before death." }),

  // Level 2
  Ceremony({ level: 2, name: "Compel Spirit", ingredients: "A token binding the ghost to the site", desc: "Issue a brief, binding command to a nearby ghost." }),
  Ceremony({ level: 2, name: "Ashes to Ashes", ingredients: "Quicklime and the caster's Vitae", desc: "Reduce a mortal corpse to fine ash within minutes." }),

  // Level 3
  Ceremony({ level: 3, name: "Host Spirit", ingredients: "The caster's own blood offered to the ghost", desc: "Invite a ghost to ride within the caster's body as a passenger." }),
  Ceremony({ level: 3, name: "Bind the Spirit", ingredients: "An object tied to the ghost in life", desc: "Chain a ghost into an object or place to compel its service." }),

  // Level 4
  Ceremony({ level: 4, name: "Blood of the Grave", ingredients: "Blood drawn beside a fresh corpse", desc: "Draw sustaining, uncanny power from proximity to the dead." }),
  Ceremony({ level: 4, name: "Split the Shroud", ingredients: "A blade wetted with Vitae", desc: "Tear a temporary opening to the land of the dead." }),

  // Level 5
  Ceremony({ level: 5, name: "The Skin Trade", ingredients: "The prepared skin of a corpse", desc: "Wear the shape and semblance of a specific dead body." }),
  Ceremony({ level: 5, name: "Lazarene Blessing", ingredients: "A corpse and a generous offering of Vitae", desc: "Raise and briefly animate a corpse as an obedient servant." }),
];
