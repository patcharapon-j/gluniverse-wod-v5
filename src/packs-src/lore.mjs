/**
 * Lore compendium — Clans and Predator Types, as JournalEntries.
 *
 * Flavor summaries are ORIGINAL text written for this system. The mechanical
 * hooks (in-clan Disciplines, Bane, Compulsion, predator feeding style and
 * headline benefits) are factual reference data. Exact dot values for predator
 * benefits are left to the Storyteller's book of record.
 */

import { Journal } from "./_helpers.mjs";

/* Build a clan journal page: original summary + a mechanical facts block. */
function clan(name, summary, { disciplines, bane, compulsion }) {
  const content =
    `<p>${summary}</p>` +
    `<hr/>` +
    `<p><strong>In-Clan Disciplines:</strong> ${disciplines.join(", ")}</p>` +
    `<p><strong>Bane:</strong> ${bane}</p>` +
    `<p><strong>Compulsion:</strong> ${compulsion}</p>`;
  return Journal({ name, pages: [{ name, content }] });
}

/* Build a predator-type journal page: original feeding style + benefit hooks. */
function predator(name, style, benefits) {
  const content =
    `<p>${style}</p>` +
    `<hr/>` +
    `<p><strong>Typical Benefits:</strong></p>` +
    `<ul>${benefits.map((b) => `<li>${b}</li>`).join("")}</ul>`;
  return Journal({ name: `Predator: ${name}`, pages: [{ name, content }] });
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
    "A dot of Celerity or Potence",
    "A specialty in Intimidation (Stalking) or Brawl (Grappling)",
    "Ties to the criminal underworld",
  ]),
  predator("Bagger", "You feed on stored, bagged, or stolen blood rather than the living — clinical, discreet, and cold.", [
    "The Iron Gullet merit to stomach old blood",
    "A dot of Blood Sorcery or a fitting utility Discipline",
    "A contact in the medical or morgue trade",
  ]),
  predator("Blood Leech", "You feed on other Kindred, hunting your own kind for their potent Vitae.", [
    "A dot of Celerity or Protean",
    "Raised Blood Potency, offset by the Prey Exclusion (mortals) flaw",
    "The enmity that comes with feeding on the Damned",
  ]),
  predator("Cleaver", "You feed quietly on your own mortal family or household, keeping them close and unaware.", [
    "A dot of Dominate or Animalism",
    "The Cleaver flaw — a mortal family you cannot abandon",
    "A herd rooted in your domestic life",
  ]),
  predator("Consensualist", "You feed only from the willing, taking blood as a gift with consent given freely.", [
    "A dot of Auspex or Fortitude",
    "A specialty in Medicine or Persuasion",
    "The Dark Secret of breaking the Masquerade to gain consent",
  ]),
  predator("Farmer", "You refuse human blood and feed on animals, clinging to the last of your humanity.", [
    "A dot of Animalism or Protean",
    "The Farmer flaw — you cannot easily feed on humans",
    "A specialty in Animal Ken",
  ]),
  predator("Osiris", "You are worshipped by a mortal following that offers you their blood in devotion.", [
    "A dot of Blood Sorcery or Presence",
    "A herd and a measure of Fame drawn from your flock",
    "The complications of a cult that depends on you",
  ]),
  predator("Sandman", "You feed on sleepers, slipping into homes to take blood from the unconscious.", [
    "A dot of Auspex or Obfuscate",
    "A specialty in Stealth",
    "A haven and resources from careful, quiet work",
  ]),
  predator("Scene Queen", "You feed within a subculture or nightlife scene where you are known and adored.", [
    "A dot of Dominate or Presence",
    "Fame and Contacts within your scene",
    "A specialty in a fitting Social skill, and a rival or two",
  ]),
  predator("Siren", "You feed through seduction, taking blood in the guise of intimacy and desire.", [
    "A dot of Fortitude or Presence",
    "The Beautiful merit",
    "A specialty in Persuasion (Seduction), and a jealous ex or enemy",
  ]),
  predator("Extortionist", "You take blood as payment, strong-arming victims who owe you protection or favors.", [
    "A dot of Dominate or Potence",
    "Contacts among police or criminals",
    "A specialty in Intimidation or Larceny",
  ]),
  predator("Graverobber", "You feed on the freshly dead and the grieving, working amid corpses and cemeteries.", [
    "A dot of Fortitude or Oblivion",
    "The Iron Gullet merit and a haven near the dead",
    "Ties to a morgue, hospital, or funeral trade",
  ]),
  predator("Roadside Killer", "You hunt travelers and the transient, taking those far from home who won't be traced to you.", [
    "A dot of Fortitude or Protean",
    "A specialty in Survival",
    "Herd represented by a hunting territory rather than fixed prey",
  ]),
  predator("Grim Reaper", "You feed on the dying and the terminally ill, easing them toward an end that comes anyway.", [
    "A dot of Auspex or Oblivion",
    "A specialty in Medicine (Terminal Patients) or Awareness",
    "Access to hospices, hospitals, or care homes",
  ]),
  predator("Montero", "You direct servants to drive prey to you, hunting in the old aristocratic style.", [
    "A dot of Dominate or Obfuscate",
    "Retainers who flush out and corner your quarry",
    "A specialty in Leadership or Stealth",
  ]),
  predator("Pursuer", "You stalk a chosen victim for days, learning them intimately before you strike.", [
    "A dot of Animalism or Auspex",
    "A specialty in Investigation (Profiling)",
    "The Bloodhound merit and contacts among the overlooked",
  ]),
  predator("Trapdoor", "You lure prey into a lair you control, feeding on those who enter your web.", [
    "A dot of Obfuscate or Protean",
    "A Haven with trap-like features",
    "A specialty in Stealth or Persuasion",
  ]),
];

export default [...clans, ...predators];
