/**
 * Equipment compendium — Weapons, Armor, and Gear.
 *
 * Damage ratings, armor values, and ranges are mechanical facts; descriptions
 * are original one-line summaries. Damage is the V5 weapon impact added to the
 * attack's margin; most weapons deal Superficial damage to Kindred.
 */

import { Weapon, Armor, Gear } from "./_helpers.mjs";

const melee = (name, damage, concealment, desc, damageType = "superficial") =>
  Weapon({ name, damage, damageType, pool: "Strength + Melee", range: "Close", concealment, desc });
const brawl = (name, damage, concealment, desc) =>
  Weapon({ name, damage, damageType: "superficial", pool: "Strength + Brawl", range: "Close", concealment, desc });
const gun = (name, damage, range, concealment, desc) =>
  Weapon({ name, damage, damageType: "superficial", pool: "Composure + Firearms", range, concealment, desc });

export default [
  /* --- Weapons: brawl & melee ------------------------------------------ */
  brawl("Brass Knuckles", 1, "Pocket", "Weighted knuckles that add bite to an unarmed strike."),
  melee("Knife", 1, "Pocket", "A concealable blade for close, quiet work."),
  melee("Baseball Bat", 2, "Jacket", "An improvised bludgeon that is legal to carry almost anywhere."),
  melee("Machete", 2, "Coat", "A heavy chopping blade favored for messy, decisive violence."),
  melee("Sword", 3, "None", "A long blade; elegant, deadly, and hard to hide."),
  melee("Fire Axe", 3, "None", "A two-handed axe that hits with tremendous force."),
  Weapon({ name: "Wooden Stake", damage: 2, damageType: "aggravated", pool: "Strength + Melee", range: "Close", concealment: "Pocket", desc: "A sharpened stake; drive it into the heart to paralyze a vampire." }),

  /* --- Weapons: firearms ----------------------------------------------- */
  gun("Light Pistol", 2, "Short", "Pocket", "A small-caliber handgun, easy to conceal."),
  gun("Heavy Pistol", 3, "Medium", "Jacket", "A large-caliber sidearm with real stopping power."),
  gun("Submachine Gun", 3, "Medium", "Coat", "A compact automatic weapon for close-quarters bursts."),
  gun("Shotgun", 4, "Short", "None", "A devastating close-range weapon with a wide spread."),
  gun("Assault Rifle", 4, "Long", "None", "A military automatic rifle, accurate at range."),
  gun("Hunting Rifle", 4, "Long", "None", "A bolt-action rifle built for precise long-range shots."),

  /* --- Armor ------------------------------------------------------------ */
  Armor({ name: "Reinforced Clothing", rating: 2, type: "Concealable", penalty: 0, desc: "Padded or layered clothing offering discreet protection." }),
  Armor({ name: "Ballistic Vest", rating: 4, type: "Body armor", penalty: 0, desc: "A concealable vest that turns bullets and blades." }),
  Armor({ name: "Riot Gear", rating: 4, type: "Heavy", penalty: 2, desc: "Full tactical armor; heavy, obvious, and highly protective." }),

  /* --- Gear ------------------------------------------------------------- */
  Gear({ name: "Burner Phone", cost: "•", desc: "A cheap, disposable prepaid phone with no ties to your identity." }),
  Gear({ name: "Laptop", cost: "••", desc: "A capable portable computer for research and remote work." }),
  Gear({ name: "Lockpick Set", cost: "•", desc: "Slim tools for defeating mechanical locks."}),
  Gear({ name: "First-Aid Kit", cost: "•", desc: "Supplies for stabilizing and treating mortal injuries." }),
  Gear({ name: "Blood Bag", cost: "•", desc: "A medical bag of stored blood; unappetizing without Iron Gullet." }),
  Gear({ name: "Flashlight", cost: "•", desc: "A bright handheld light for dark places." }),
  Gear({ name: "Zip Ties", cost: "•", desc: "Disposable restraints for binding a captive's hands." }),
  Gear({ name: "Forged Identity", cost: "•••", desc: "A convincing false ID package — license, cards, and papers." }),
  Gear({ name: "Body Bag", cost: "•", desc: "A discreet way to move a corpse or a torpid Kindred." }),
  Gear({ name: "Digital Camera", cost: "••", desc: "A quality camera for surveillance and evidence." }),
];
