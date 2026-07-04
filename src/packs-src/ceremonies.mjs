/**
 * Oblivion Ceremonies compendium (levels 1–5).
 *
 * Every ceremony listed on the Paradox VtM wiki Oblivion Ceremonies page,
 * across the V5 line (Corebook, Cults of the Blood Gods, Blood Sigils, and
 * more). Ceremony level and casting pool are mechanical facts; descriptions are
 * original one-line summaries. `source` names the book.
 */

import { Ceremony } from "./_helpers.mjs";

export default [
  // Level 1
  Ceremony({ level: 1, name: "Gift of False Life", ingredients: "A fresh corpse and the caster's Vitae", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Animate corpses to perform simple, repetitive tasks." }),
  Ceremony({ level: 1, name: "Knowing Stone", ingredients: "A stone anointed with the caster's Vitae", pool: "Resolve + Oblivion", source: "Fall of London", desc: "Enchant a stone that points the way toward a specific known ghost." }),
  Ceremony({ level: 1, name: "Summon Spirit", ingredients: "An object the ghost is tied to", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Call a wraith bound to its fetter into your presence." }),
  Ceremony({ level: 1, name: "Traveler's Call", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Summon a fellow Shalimite, who may resist at a lingering penalty." }),

  // Level 2
  Ceremony({ level: 2, name: "Ashen Relic", pool: "Resolve + Oblivion", source: "Book of Nod Apocrypha", desc: "Preserve a vampire's body from decay, better with greater success." }),
  Ceremony({ level: 2, name: "Awaken the Homuncular Servant", ingredients: "A body part or a small dead animal", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Craft a tiny homunculus spy from scraps of the dead." }),
  Ceremony({ level: 2, name: "Blinding the Alloy Eye", pool: "Resolve + Oblivion", source: "Sabbat", desc: "Blur your image so cameras cannot record you clearly." }),
  Ceremony({ level: 2, name: "Compel Spirit", ingredients: "A token binding the ghost to the site", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Issue a brief, binding command to a nearby ghost." }),
  Ceremony({ level: 2, name: "Maw of Ahriman", pool: "Resolve + Oblivion", source: "Blood Stained Love", desc: "Open an Abyssal portal, usually within your own silenced mouth." }),

  // Level 3
  Ceremony({ level: 3, name: "Create Corpse Suit", pool: "Resolve + Oblivion", source: "Tattered Façade", desc: "Stitch a semi-sentient flesh garment that warns its wearer of danger." }),
  Ceremony({ level: 3, name: "Create Flesh Golem", pool: "Resolve + Oblivion", source: "Tattered Façade", desc: "Assemble a servile golem from the parts of a corpse." }),
  Ceremony({ level: 3, name: "Fortezza Sindonica", ingredients: "A consecrated cloth and Vitae", pool: "Resolve + Oblivion", source: "Trails of Ash and Bone", desc: "Raise a ward that traps and harms wraiths in an area." }),
  Ceremony({ level: 3, name: "Harrowhaunt", ingredients: "Grave earth spread across a threshold", pool: "Resolve + Oblivion", source: "Sabbat", desc: "Steep an area so intruding mortals are struck with dread." }),
  Ceremony({ level: 3, name: "Host Spirit", ingredients: "The caster's own blood offered to the ghost", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Invite a ghost to ride within the caster's body as a passenger." }),
  Ceremony({ level: 3, name: "Knit the Veil", ingredients: "A ceremonial candle", pool: "Resolve + Oblivion", source: "Trails of Ash and Bone", desc: "Seal tears in the Shroud while the candle burns." }),
  Ceremony({ level: 3, name: "Name of the Father", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Paralyze a victim's mind with Oblivion's void until they exert will." }),
  Ceremony({ level: 3, name: "Shallow Slumber", pool: "Resolve + Oblivion", source: "Gehenna War", desc: "Shorten the time a vampire must spend lying in torpor." }),
  Ceremony({ level: 3, name: "Shambling Hordes", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Raise a pack of aggressive walking dead under your command." }),
  Ceremony({ level: 3, name: "Wisdom of the Dead", ingredients: "A skull or severed head", pool: "Resolve + Oblivion", source: "Book of Nod Apocrypha", desc: "Wring skills or answers from the skull of the dead." }),

  // Level 4
  Ceremony({ level: 4, name: "Befoul Vessel", pool: "Resolve + Oblivion", source: "Sabbat", desc: "Turn a mortal's blood into untraceable poison lethal to vampires." }),
  Ceremony({ level: 4, name: "Bind the Spirit", ingredients: "An object tied to the ghost in life", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Chain a ghost into an object or place to compel its service." }),
  Ceremony({ level: 4, name: "Bind to Mortal Form", pool: "Resolve + Oblivion", source: "Tattered Façade", desc: "Prolong a mortal's lifespan without ghouling, though they keep aging." }),
  Ceremony({ level: 4, name: "Death Rattle", pool: "Resolve + Oblivion", source: "Trails of Ash and Bone", desc: "Force a target to relive the sensations of a wraith's death." }),
  Ceremony({ level: 4, name: "Split the Veil", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Thin a location's shroud so wraiths can cross into the living world." }),

  // Level 5
  Ceremony({ level: 5, name: "Ex Nihilo", ingredients: "A threshold marked in Vitae", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Step bodily across into the realm of the dead." }),
  Ceremony({ level: 5, name: "Gift of True Life", pool: "Resolve + Oblivion", source: "Tattered Façade", desc: "Lengthen one mortal's life by draining years from another." }),
  Ceremony({ level: 5, name: "Lazarene Blessing", ingredients: "A corpse and a generous offering of Vitae", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Raise and briefly animate a corpse as an obedient servant." }),
  Ceremony({ level: 5, name: "Pit of Contemplation", ingredients: "A sealed vessel and grave earth", pool: "Resolve + Oblivion", source: "Cults of the Blood Gods", desc: "Imprison a soul or spirit in confinement." }),
];
