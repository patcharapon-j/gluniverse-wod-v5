/**
 * Equipment compendium — Weapons, Armor, and Gear.
 *
 * Core Rulebook combat and gear tables, broadened with common items from the
 * wider V5 line (Players Guide, Second Inquisition). Damage ratings, armor
 * values, and ranges are mechanical facts; descriptions are original one-line
 * summaries. Damage is the V5 weapon impact added to the attack's margin; most
 * weapons deal Superficial damage to Kindred (fire and stakes are noted).
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
  melee("Improvised Weapon", 1, "None", "A bottle, pipe, or chair leg pressed into service."),
  melee("Knife", 1, "Pocket", "A concealable blade for close, quiet work."),
  melee("Baseball Bat", 2, "Jacket", "An improvised bludgeon that is legal to carry almost anywhere."),
  melee("Machete", 2, "Coat", "A heavy chopping blade favored for messy, decisive violence."),
  melee("Sword", 3, "None", "A long blade; elegant, deadly, and hard to hide."),
  melee("Fire Axe", 3, "None", "A two-handed axe that hits with tremendous force."),
  Weapon({ name: "Chainsaw", damage: 4, damageType: "aggravated", pool: "Strength + Melee", range: "Close", concealment: "None", source: "Players Guide", desc: "A loud, unwieldy tool that tears flesh into Aggravated ruin." }),
  Weapon({ name: "Wooden Stake", damage: 2, damageType: "aggravated", pool: "Strength + Melee", range: "Close", concealment: "Pocket", desc: "A sharpened stake; drive it into the heart to paralyze a vampire." }),
  melee("Sap", 0, "Pocket", "A weighted leather blackjack made to drop a mark without killing them."),
  melee("Crowbar", 1, "Jacket", "A steel pry bar; equally handy for forcing doors and cracking skulls."),
  melee("Katana", 3, "Coat", "A masterwork long blade prized for its balance and razor edge."),
  melee("Sledgehammer", 3, "None", "A heavy two-handed hammer that crushes rather than cuts."),
  Weapon({ name: "Chain", damage: 1, damageType: "superficial", pool: "Strength + Melee", range: "Close", concealment: "Jacket", desc: "A length of heavy chain or whip, awkward to aim but able to snag a limb." }),
  Weapon({ name: "Riot Shield", damage: 1, damageType: "superficial", pool: "Strength + Melee", range: "Close", concealment: "None", desc: "A transparent ballistic shield; bashes with the rim and doubles as cover (see Riot Shield armor)." }),

  /* --- Weapons: firearms & ranged -------------------------------------- */
  gun("Light Pistol", 2, "Short", "Pocket", "A small-caliber handgun, easy to conceal."),
  gun("Heavy Pistol", 3, "Medium", "Jacket", "A large-caliber sidearm with real stopping power."),
  gun("Submachine Gun", 3, "Short", "Jacket", "A compact automatic weapon for close-quarters bursts."),
  gun("Shotgun", 4, "Short", "Coat", "A devastating close-range weapon with a wide spread."),
  gun("Assault Rifle", 4, "Long", "None", "A military automatic rifle, accurate at range."),
  gun("Hunting Rifle", 3, "Long", "None", "A bolt-action rifle built for precise long-range shots."),
  Weapon({ name: "Crossbow", damage: 2, damageType: "superficial", pool: "Composure + Firearms", range: "Medium", concealment: "Coat", source: "Players Guide", desc: "A silent ranged weapon that can loose wooden bolts at the heart." }),
  Weapon({ name: "Taser", damage: 0, damageType: "superficial", pool: "Composure + Firearms", range: "Close", concealment: "Pocket", source: "Players Guide", desc: "A non-lethal stun weapon; of little use against the Kindred." }),
  Weapon({ name: "Molotov Cocktail", damage: 3, damageType: "aggravated", pool: "Dexterity + Athletics", range: "Short", concealment: "Jacket", source: "Players Guide", desc: "A thrown firebomb; fire deals Aggravated damage to vampires." }),
  gun("Sniper Rifle", 5, "Extreme", "None", "A precision long-range rifle built for a single devastating shot."),
  Weapon({ name: "Frag Grenade", damage: 5, damageType: "superficial", pool: "Dexterity + Athletics", range: "Short", concealment: "Jacket", desc: "A hand-thrown explosive that shreds everything in the blast radius." }),
  Weapon({ name: "Flamethrower", damage: 3, damageType: "aggravated", pool: "Dexterity + Firearms", range: "Short", concealment: "None", desc: "A tank-fed jet of burning fuel; fire deals Aggravated damage to vampires." }),
  Weapon({ name: "Dragon's Breath Shotgun Shells", damage: 0, damageType: "aggravated", pool: "Composure + Firearms", range: "Short", concealment: "None", source: "Second Inquisition", desc: "Incendiary shotgun rounds loaded to punish the undead; use with a shotgun, replacing its damage type with Aggravated." }),
  Weapon({ name: "Flashbang", damage: 0, damageType: "superficial", pool: "Dexterity + Athletics", range: "Short", concealment: "Jacket", desc: "A stun grenade whose flash and roar blind and deafen everyone nearby." }),
  Weapon({ name: "Pepper Spray", damage: 0, damageType: "superficial", pool: "Dexterity + Athletics", range: "Close", concealment: "Pocket", desc: "A canister of chemical irritant that blinds and chokes an attacker." }),
  Weapon({ name: "Bow", damage: 2, damageType: "superficial", pool: "Dexterity + Firearms", range: "Medium", concealment: "None", desc: "A silent hunting bow, slow to nock but nearly soundless in use." }),

  /* --- Armor ------------------------------------------------------------ */
  Armor({ name: "Reinforced Clothing", rating: 2, type: "Concealable", penalty: 0, desc: "Padded or layered clothing offering discreet protection." }),
  Armor({ name: "Kevlar Vest", rating: 2, type: "Concealable", penalty: 0, desc: "A soft body-armor vest worn hidden under clothing." }),
  Armor({ name: "Ballistic Vest", rating: 4, type: "Body armor", penalty: 0, desc: "A concealable vest that turns bullets and blades." }),
  Armor({ name: "Riot Gear", rating: 4, type: "Heavy", penalty: 2, desc: "Full tactical armor; heavy, obvious, and highly protective." }),
  Armor({ name: "Tactical SWAT Armor", rating: 6, type: "Military", penalty: 2, source: "Second Inquisition", desc: "Full-body Second Inquisition gear; encumbering but formidable." }),
  Armor({ name: "Riot Shield", rating: 3, type: "Shield", penalty: 0, desc: "A handheld ballistic shield; blocks frontal attacks but leaves the flanks bare." }),
  Armor({ name: "Motorcycle Leathers", rating: 1, type: "Concealable", penalty: 0, desc: "Reinforced riding leathers that double as light, unassuming protection." }),

  /* --- Gear ------------------------------------------------------------- */
  Gear({ name: "Burner Phone", cost: "•", desc: "A cheap, disposable prepaid phone with no ties to your identity." }),
  Gear({ name: "Laptop", cost: "••", desc: "A capable portable computer for research and remote work." }),
  Gear({ name: "Lockpick Set", cost: "•", desc: "Slim tools for defeating mechanical locks." }),
  Gear({ name: "First-Aid Kit", cost: "•", desc: "Supplies for stabilizing and treating mortal injuries." }),
  Gear({ name: "Blood Bag", cost: "•", desc: "A medical bag of stored blood; unappetizing without Iron Gullet." }),
  Gear({ name: "Phlebotomy Kit", cost: "••", source: "Players Guide", desc: "Needles, tubing, and bags for drawing and storing blood cleanly." }),
  Gear({ name: "Blood Cooler", cost: "••", source: "Players Guide", desc: "A cooled case that preserves a stock of Vitae for a haven." }),
  Gear({ name: "Flashlight", cost: "•", desc: "A bright handheld light for dark places." }),
  Gear({ name: "Zip Ties", cost: "•", desc: "Disposable restraints for binding a captive's hands." }),
  Gear({ name: "Forged Identity", cost: "•••", desc: "A convincing false ID package — license, cards, and papers." }),
  Gear({ name: "Body Bag", cost: "•", desc: "A discreet way to move a corpse or a torpid Kindred." }),
  Gear({ name: "Digital Camera", cost: "••", desc: "A quality camera for surveillance and evidence." }),
  Gear({ name: "Surveillance Kit", cost: "•••", source: "Second Inquisition", desc: "Bugs, hidden cameras, and trackers for watching a target." }),
  Gear({ name: "Night-Vision Goggles", cost: "•••", source: "Second Inquisition", desc: "Low-light optics for hunting and infiltration in the dark." }),
  Gear({ name: "Accelerant", cost: "•", desc: "Gasoline or lighter fluid to start a fire and destroy evidence." }),
  Gear({ name: "Car", cost: "••", desc: "A reliable vehicle for transport and a quick escape." }),
  Gear({ name: "UV Floodlight", cost: "•••", source: "Second Inquisition", desc: "A portable rig of ultraviolet lamps built to burn Kindred like sunlight." }),
  Gear({ name: "Thermal Imaging Scope", cost: "•••", source: "Second Inquisition", desc: "A heat-sensing optic that spots a warm mortal but not a cold corpse." }),
  Gear({ name: "Signal Jammer", cost: "••", source: "Second Inquisition", desc: "A device that blankets an area, blocking phones and wireless signals." }),
  Gear({ name: "Encrypted Radio Set", cost: "••", source: "Second Inquisition", desc: "Paired handsets with scrambled channels for coordinating a raid." }),
  Gear({ name: "Blood Tester Kit", cost: "••", source: "Second Inquisition", desc: "Field reagents and strips that flag Vitae's inhuman properties in a sample." }),
  Gear({ name: "Animal Trap", cost: "•", desc: "A cage trap for catching small game to feed on quietly." }),
  Gear({ name: "Blackout Curtains Kit", cost: "•", desc: "Heavy light-proof drapes and seals for a windowed daytime haven." }),
  Gear({ name: "Transport Crate", cost: "••", desc: "A padded, light-sealed crate for moving a torpid body undetected." }),
  Gear({ name: "Guard Dog", cost: "••", desc: "A trained animal kept at a haven to warn of or deter intruders." }),
  Gear({ name: "Climbing Kit", cost: "••", desc: "Rope, harness, and hardware for scaling walls and rooftops." }),
  Gear({ name: "Disguise Kit", cost: "••", desc: "Makeup, wigs, and props for altering one's appearance on short notice." }),
  Gear({ name: "Paramedic Kit", cost: "••", desc: "Convincing EMS gear and credentials that excuse handling the injured." }),
  Gear({ name: "Hacking Rig", cost: "•••", source: "Second Inquisition", desc: "A laptop loaded with intrusion tools for cracking networks and cameras." }),
];
