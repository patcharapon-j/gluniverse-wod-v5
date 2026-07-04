/**
 * Lore compendium — Clans and Predator Types, as JournalEntries.
 *
 * Flavor summaries are ORIGINAL text written for this system. The mechanical
 * hooks (in-clan Disciplines, Bane, Compulsion, predator feeding style and
 * headline benefits) are factual reference data. Exact dot values for predator
 * benefits are left to the Storyteller's book of record.
 */

import { Journal } from "./_helpers.mjs";

const SYSTEM_ID = "gluniverse-wod-v5";

/* Display name → config key, so a dropped lore entry can set the matching field. */
const CLAN_KEY = {
  Brujah: "brujah", Gangrel: "gangrel", Malkavian: "malkavian", Nosferatu: "nosferatu",
  Toreador: "toreador", Tremere: "tremere", Ventrue: "ventrue", "Banu Haqim": "banuHaqim",
  Hecata: "hecata", Lasombra: "lasombra", "The Ministry": "ministry", Ravnos: "ravnos",
  Salubri: "salubri", Tzimisce: "tzimisce", Caitiff: "caitiff", "Thin-Blood": "thinBlood",
};
const PRED_KEY = {
  "Alley Cat": "alleycat", Bagger: "bagger", "Blood Leech": "bloodLeech", Cleaver: "cleaver",
  Consensualist: "consensualist", Farmer: "farmer", Osiris: "osiris", Sandman: "sandman",
  "Scene Queen": "sceneQueen", Siren: "siren", Extortionist: "extortionist",
  Graverobber: "graverobber", "Roadside Killer": "roadsideKiller", "Grim Reaper": "grimReaper",
  Montero: "montero", Pursuer: "pursuer", Trapdoor: "trapdoor",
  "Tithe Collector": "titheCollector",
};

/* Build a clan journal page: original summary + a mechanical facts block. */
function clan(name, summary, { disciplines, bane, compulsion }) {
  const content =
    `<p>${summary}</p>` +
    `<hr/>` +
    `<p><strong>In-Clan Disciplines:</strong> ${disciplines.join(", ")}</p>` +
    `<p><strong>Bane:</strong> ${bane}</p>` +
    `<p><strong>Compulsion:</strong> ${compulsion}</p>`;
  const flags = CLAN_KEY[name] ? { [SYSTEM_ID]: { clanKey: CLAN_KEY[name] } } : undefined;
  return Journal({ name, flags, pages: [{ name, content }] });
}

/* Build a predator-type journal page: original feeding style + benefit hooks. */
function predator(name, style, benefits, source = "Core") {
  const content =
    `<p>${style}</p>` +
    `<hr/>` +
    `<p><strong>Feeding Benefits:</strong></p>` +
    `<ul>${benefits.map((b) => `<li>${b}</li>`).join("")}</ul>` +
    `<p><em>Source: ${source}</em></p>`;
  const flags = PRED_KEY[name] ? { [SYSTEM_ID]: { predatorKey: PRED_KEY[name] } } : undefined;
  return Journal({ name: `Predator: ${name}`, flags, pages: [{ name, content }] });
}

const clans = [
  clan("Brujah", "Iconoclasts and rebels who wear their fury openly, the Brujah were once philosopher-warriors and are now the Camarilla's most volatile idealists. They fight for causes and grudges alike, and their passion is as much a weapon as a weakness.", {
    disciplines: ["Celerity", "Potence", "Presence"],
    bane: "Violence — harder to resist the pull of fury and frenzy.",
    compulsion: "Rebellion — driven to defy whatever authority is nearest.",
  }),
  clan("Gangrel", "Survivors and wanderers closest to the Beast, the Gangrel prize freedom and endurance over the politics of the courts. Feral and self-reliant, they take on the traits of animals and shrug off wounds that would fell others.", {
    disciplines: ["Animalism", "Fortitude", "Protean"],
    bane: "The Beast — gain bestial features when frenzying.",
    compulsion: "Feral Impulses — reason gives way to animal instinct.",
  }),
  clan("Malkavian", "Cursed and gifted with fractured sight, the Malkavians perceive truths hidden from saner minds. Their madness is also a lens — insight, prophecy, and terrible clarity bought at the price of a broken perspective.", {
    disciplines: ["Auspex", "Dominate", "Obfuscate"],
    bane: "Fractured Perspective — a persistent affliction of the mind.",
    compulsion: "Delusion — perception warps until the fracture is fed.",
  }),
  clan("Nosferatu", "Hideously disfigured by the Embrace, the Nosferatu trade in secrets from the shadows and sewers. What society denies them in appearance they reclaim in information — no one knows more, and no one is harder to find.", {
    disciplines: ["Animalism", "Obfuscate", "Potence"],
    bane: "Repulsiveness — monstrous looks that cannot be hidden away.",
    compulsion: "Cryptophilia — an aching need to obtain and hoard secrets.",
  }),
  clan("Toreador", "Enraptured by beauty and art, the Toreador are the seducers and tastemakers of Kindred society. They move gracefully through mortal culture, but their fixation on the sublime can leave them frozen before it.", {
    disciplines: ["Auspex", "Celerity", "Presence"],
    bane: "Aesthetic Fixation — enthralled to the point of paralysis by beauty.",
    compulsion: "Obsession — seized by a single fascination.",
  }),
  clan("Tremere", "Once a house of mortal mages, the Tremere bent blood itself into sorcery and paid for it with the enmity of their peers. Disciplined and hierarchical, they wield Blood Sorcery no other clan can match.", {
    disciplines: ["Auspex", "Blood Sorcery", "Dominate"],
    bane: "Deficient Bonds — their once-rigid blood ties now form unreliably.",
    compulsion: "Perfectionism — nothing short of flawless will do.",
  }),
  clan("Ventrue", "Born to rule, or convinced they were, the Ventrue are the aristocrats and directors of the Camarilla. They command with money, tradition, and force of will — and feed only on prey worthy of their refined tastes.", {
    disciplines: ["Dominate", "Fortitude", "Presence"],
    bane: "Rarefied Tastes — can feed only on a narrow, particular kind of prey.",
    compulsion: "Arrogance — must command and be obeyed.",
  }),
  clan("Banu Haqim", "Judges and warrior-scholars, the Banu Haqim weigh the sins of the Kindred and hunger for the power in their blood. Torn between law and appetite, they walk a razor's edge between justice and predation.", {
    disciplines: ["Blood Sorcery", "Celerity", "Obfuscate"],
    bane: "Blood Addiction — drinking Kindred blood risks a compelling craving.",
    compulsion: "Judgment — compelled to punish those who transgress your code.",
  }),
  clan("Hecata", "A grim alliance of death-touched bloodlines, the Hecata traffic with the dead and treat mortality as a family business. Necromancers and morticians, they are indispensable and quietly feared.", {
    disciplines: ["Auspex", "Fortitude", "Oblivion"],
    bane: "Painful Kiss — their bite brings agony, not ecstasy.",
    compulsion: "Morbidity — drawn to dwell on death and endings.",
  }),
  clan("Lasombra", "Predators of the shadow, the Lasombra command darkness and prize dominion above all. Recent defectors to the Camarilla, they are ruthless climbers who see mastery as its own justification.", {
    disciplines: ["Dominate", "Oblivion", "Potence"],
    bane: "Distorted Image — they register poorly in mirrors and recordings.",
    compulsion: "Ruthlessness — accept nothing less than total success.",
  }),
  clan("The Ministry", "Heirs to an ancient serpent faith, the Ministry tempt and liberate — freeing mortals from restraint, and binding them in the process. They deal in desire, revelation, and the slow corruption of the certain.", {
    disciplines: ["Obfuscate", "Presence", "Protean"],
    bane: "Cursed by Light — bright light harms them more than most.",
    compulsion: "Transgression — must break a taboo or boundary.",
  }),
  clan("Ravnos", "Restless illusionists and travelers, the Ravnos never stay still — and cannot, without inviting ruin. They live by wit, deception, and daring, always one step ahead of a curse that follows the idle.", {
    disciplines: ["Animalism", "Obfuscate", "Presence"],
    bane: "Doomed — resting too long in one place invites disaster.",
    compulsion: "Tempting Fate — must take the riskier path.",
  }),
  clan("Salubri", "Rare and hunted, the Salubri are healers and mystics marked by a third eye. Nearly driven to extinction, they cling to purpose and compassion in a world that treats them as prey.", {
    disciplines: ["Auspex", "Dominate", "Fortitude"],
    bane: "Hunted — their opened third eye betrays them, and their kind are prized.",
    compulsion: "Affective Empathy — overwhelmed by another's suffering.",
  }),
  clan("Tzimisce", "Territorial and transformative, the Tzimisce reshape flesh, land, and loyalty to their designs. Ancient and possessive, they bind themselves to what they own and remake everything they touch.", {
    disciplines: ["Animalism", "Dominate", "Protean"],
    bane: "Grounded — must rest near something they have claimed as their own.",
    compulsion: "Covetousness — seized by the need to possess.",
  }),
  clan("Caitiff", "The clanless, Embraced without lineage or left to find their own way, the Caitiff belong to no one. Distrusted and dismissed, they are also unbound — free to become whatever they can make of the curse.", {
    disciplines: ["Any (choose freely; no in-clan set)"],
    bane: "No fixed Bane, but Kindred society treats them with suspicion.",
    compulsion: "None inherent to the clanless.",
  }),
  clan("Thin-Blood", "Barely vampires at all, the thin-blooded stand between mortality and the curse. Weak in the eyes of elders, they are also adaptable — able to walk in half-sunlight, sometimes eat, and brew blood into alchemy.", {
    disciplines: ["Thin-Blood Alchemy (in place of a clan Discipline set)"],
    bane: "No standard clan Bane; defined instead by thin-blood merits and flaws.",
    compulsion: "None standard; varies by the individual's thin-blood traits.",
  }),
];

const predators = [
  predator("Alley Cat", "You hunt by ambush and intimidation, taking blood by force from those the world won't miss.", [
    "Specialty: Intimidation (Stickups) or Brawl (Grappling)",
    "Gain one dot of Celerity or Potence",
    "Lose one dot of Humanity",
    "Gain three dots of Criminal Contacts",
  ], "Core"),
  predator("Bagger", "You feed on stored, bagged, or stolen blood rather than the living — clinical, discreet, and cold. Ventrue cannot take this type.", [
    "Specialty: Larceny (Lockpicking) or Streetwise (Black Market)",
    "Gain one dot of Blood Sorcery (Tremere/Banu Haqim), Oblivion (Hecata), or Obfuscate",
    "Gain the Iron Gullet merit (•••)",
    "Gain an Enemy flaw (••)",
  ], "Core"),
  predator("Blood Leech", "You feed on other Kindred, hunting your own kind for their potent Vitae.", [
    "Specialty: Brawl (Kindred) or Stealth (against Kindred)",
    "Gain one dot of Celerity or Protean",
    "Lose one dot of Humanity; raise Blood Potency by one",
    "Gain Diablerist (••) or Shunned (••), plus Prey Exclusion (mortals) (••)",
  ], "Core"),
  predator("Cleaver", "You feed quietly on your own mortal family or household, keeping them close and unaware.", [
    "Specialty: Persuasion (Gaslighting) or Subterfuge (Coverups)",
    "Gain one dot of Dominate or Animalism",
    "Gain the Dark Secret: Cleaver flaw (•)",
    "Gain the Herd advantage (••)",
  ], "Core"),
  predator("Consensualist", "You feed only from the willing, taking blood as a gift with consent given freely.", [
    "Specialty: Medicine (Phlebotomy) or Persuasion (Vessels)",
    "Gain one dot of Auspex or Fortitude",
    "Gain one dot of Humanity",
    "Gain Masquerade Breacher (•) and Prey Exclusion (non-consenting) (•)",
  ], "Core"),
  predator("Farmer", "You refuse human blood and feed on animals, clinging to the last of your humanity. Ventrue cannot take this type, nor characters at Blood Potency 3+.", [
    "Specialty: Animal Ken (specific animal) or Survival (Hunting)",
    "Gain one dot of Animalism or Protean",
    "Gain one dot of Humanity",
    "Gain the Farmer feeding flaw (••)",
  ], "Core"),
  predator("Osiris", "You are worshipped by a mortal following that offers you their blood in devotion.", [
    "Specialty: Occult (tradition) or Performance (field)",
    "Gain one dot of Blood Sorcery (Tremere/Banu Haqim) or Presence",
    "Spend three dots between Fame and Herd",
    "Spend two dots between Enemies and Mythic flaws",
  ], "Core"),
  predator("Sandman", "You feed on sleepers, slipping into homes to take blood from the unconscious.", [
    "Specialty: Medicine (Anesthetics) or Stealth (Break-in)",
    "Gain one dot of Auspex or Obfuscate",
    "Gain one dot of Resources",
  ], "Core"),
  predator("Scene Queen", "You feed within a subculture or nightlife scene where you are known and adored.", [
    "Specialty: Etiquette, Leadership, or Streetwise (a specific scene)",
    "Gain one dot of Dominate or Potence",
    "Gain Fame (•) and a Contact (•)",
    "Gain Disliked (•) or Prey Exclusion (a rival scene) (•)",
  ], "Core"),
  predator("Siren", "You feed through seduction, taking blood in the guise of intimacy and desire.", [
    "Specialty: Persuasion (Seduction) or Subterfuge (Seduction)",
    "Gain one dot of Fortitude or Presence",
    "Gain the Beautiful merit (••)",
    "Gain an Enemy flaw (•) — a spurned lover or jealous partner",
  ], "Core"),
  predator("Extortionist", "You acquire blood in exchange for protection, security, or surveillance — genuine or fabricated.", [
    "Specialty: Intimidation (Coercion) or Larceny (Security)",
    "Gain one dot of Dominate or Potence",
    "Spend three dots between Contacts and Resources",
    "Gain an Enemy flaw (••)",
  ], "Cults of the Blood Gods"),
  predator("Graverobber", "You feed on the freshly dead and the grieving, working amid corpses, morgues, and cemeteries.", [
    "Specialty: Occult (Grave Rituals) or Medicine (Cadavers)",
    "Gain one dot of Fortitude or Oblivion",
    "Gain the Iron Gullet merit (•••) and a Haven (•)",
    "Gain the Obvious Predator herd flaw (••)",
  ], "Cults of the Blood Gods"),
  predator("Roadside Killer", "You never stay in one place, hunting travelers and the transient who won't be missed.", [
    "Specialty: Survival (the road) or Investigation (vampire cant)",
    "Gain one dot of Fortitude or Protean",
    "Gain two dots of migrating Herd",
    "Gain the Prey Exclusion (locals) flaw",
  ], "Let the Streets Run Red"),
  predator("Grim Reaper", "You feed on the dying in hospices, care homes, and hospitals, easing them toward an inevitable end.", [
    "Specialty: Awareness (Death) or Larceny (Forgery)",
    "Gain one dot of Auspex or Oblivion",
    "Gain one dot of Allies or Influence in the medical community",
    "Gain one dot of Humanity; gain Prey Exclusion (healthy mortals) (•)",
  ], "Players Guide"),
  predator("Montero", "You direct trained servants to drive prey toward you, hunting in the old aristocratic style.", [
    "Specialty: Leadership (Hunting Pack) or Stealth (Stakeout)",
    "Gain one dot of Dominate or Obfuscate",
    "Gain two dots of Retainers",
    "Lose one dot of Humanity",
  ], "Players Guide"),
  predator("Pursuer", "You stalk a chosen victim for days, learning their habits before you strike at the perfect moment.", [
    "Specialty: Investigation (Profiling) or Stealth (Shadowing)",
    "Gain one dot of Animalism or Auspex",
    "Gain the Bloodhound merit (•) and a dot of Contacts",
    "Lose one dot of Humanity",
  ], "Players Guide"),
  predator("Trapdoor", "You build a nest and lure prey inside, feeding on those who enter your web.", [
    "Specialty: Persuasion (Marketing) or Stealth (Ambushes/Traps)",
    "Gain one dot of Protean or Obfuscate",
    "Gain a Haven (•) plus a dot of Retainers, Herd, or a second Haven dot",
    "Gain the Creepy (•) or Haunted (•) haven flaw",
  ], "Players Guide"),
  predator("Tithe Collector", "Other Kindred pay you tribute in specially selected vessels, delivered on schedule or on request.", [
    "Specialty: Intimidation (Kindred) or Leadership (Kindred)",
    "Gain one dot of Dominate or Presence",
    "Gain three dots of Domain or Status",
    "Gain an Adversary flaw (••)",
  ], "In Memoriam"),
];

export default [...clans, ...predators];
