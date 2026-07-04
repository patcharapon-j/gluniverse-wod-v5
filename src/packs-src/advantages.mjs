/**
 * Advantages compendium — Backgrounds, Merits, Flaws, and Loresheets.
 *
 * Drawn from the whole V5 line (Core Rulebook, Players Guide, Companion,
 * Camarilla, Anarch, Cults of the Blood Gods, Chicago by Night, Sabbat, Blood
 * Sigils, Gehenna War, and more). Category (kind) and dot range are mechanical
 * facts; descriptions are original one-line summaries. `value` is the entry's
 * default/first dot, `maxValue` the top of its range. `src` names the book.
 *
 * NB: the schema caps dots at 5, so ranges that reach 6 in print are stored as
 * 5. Loresheets are five-tier features stored as a single 1–5 advantage.
 */

import { Adv } from "./_helpers.mjs";

const bg = (name, max, desc, src) => Adv({ kind: "background", name, value: 1, maxValue: max, desc, source: src });
const merit = (name, min, max, desc, src) => Adv({ kind: "merit", name, value: min, maxValue: max, desc, source: src });
const flaw = (name, min, max, desc, src) => Adv({ kind: "flaw", name, value: min, maxValue: max, desc, source: src });
const lore = (name, desc, src) => Adv({ kind: "loresheet", name, value: 1, maxValue: 5, desc, source: src });

export default [
  /* --- Backgrounds ------------------------------------------------------ */
  bg("Allies", 5, "Mortals who will help and act on your behalf out of loyalty."),
  bg("Contacts", 5, "Sources who provide information, goods, or introductions."),
  bg("Fame", 5, "Public renown that opens doors and draws attention."),
  bg("Haven", 5, "A secure resting place; higher dots mean better security and amenities."),
  bg("Herd", 5, "A dependable pool of mortals to feed from safely."),
  bg("Influence", 5, "Sway over a sphere of mortal society or institutions."),
  bg("Mask", 2, "A fabricated mortal identity with supporting paperwork."),
  bg("Zeroed", 2, "Your records have been scrubbed from official databases.", "Players Guide"),
  bg("Cobbler", 1, "A forger who can supply you with a fresh false identity on demand.", "Players Guide"),
  bg("Mawla", 5, "An experienced Kindred mentor you can call on for aid or advice."),
  bg("Resources", 5, "Personal wealth, assets, and disposable income."),
  bg("Retainers", 5, "Devoted servants — ghouls or thralls — bound to your service."),
  bg("Status", 5, "Standing and reputation within Kindred society."),
  bg("Cult", 5, "A faith following that provides worship, cover, and material support.", "Cults of the Blood Gods"),
  bg("Familiar", 3, "A specially bonded animal or homunculus that serves and aids you.", "Cults of the Blood Gods"),
  bg("Adfectus", 3, "An intense emotional attachment that steadies you when honored.", "Players Guide"),

  /* --- Haven merits ----------------------------------------------------- */
  merit("Haven: Chasse", 1, 3, "Your haven's territory is broad and rich in feeding grounds.", "Players Guide"),
  merit("Haven: Hidden Armory", 1, 3, "A concealed cache of weapons within your haven.", "Core"),
  merit("Haven: Cell", 1, 3, "A secure space built to hold captives.", "Core"),
  merit("Haven: Watchmen", 1, 3, "Guards or security personnel who patrol your haven.", "Core"),
  merit("Haven: Laboratory", 1, 3, "A workspace equipped for science, medicine, or alchemy.", "Core"),
  merit("Haven: Library", 1, 3, "A research collection granting dice on relevant lore.", "Core"),
  merit("Haven: Location", 1, 3, "Your haven sits in an especially advantageous place.", "Core"),
  merit("Haven: Luxury", 1, 3, "Opulent surroundings that aid social occasions.", "Core"),
  merit("Haven: Postern", 1, 3, "A hidden bolt-hole or escape route out of the haven.", "Core"),
  merit("Haven: Security System", 1, 3, "Alarms and locks that resist intrusion.", "Core"),
  merit("Haven: Warding", 1, 3, "Occult protections woven into the haven itself.", "Core"),

  /* --- Merits: looks & bearing ----------------------------------------- */
  merit("Beautiful", 2, 2, "Your striking looks grant a bonus to relevant social rolls."),
  merit("Stunning", 4, 4, "Extraordinary beauty grants a larger bonus to social rolls."),
  merit("Semblance of the Methuselah", 1, 3, "You resemble a revered ancient, awing those who know the face.", "Cults of the Blood Gods"),
  merit("Famous Face", 1, 2, "You look like a celebrity, for good or ill.", "Players Guide"),
  merit("Ingénue", 1, 2, "You seem harmless and innocent, deflecting suspicion.", "Players Guide"),
  merit("Bond Resistance", 1, 3, "Each dot adds a die to resisting the Blood Bond.", "Core"),
  merit("Short Bond", 2, 2, "Your Blood Bonds fade faster than normal.", "Core"),

  /* --- Merits: feeding & the Blood -------------------------------------- */
  merit("Bloodhound", 1, 1, "You can smell traits of blood — Resonance and more — by scent."),
  merit("Iron Gullet", 3, 3, "You can feed on old, rancid, or cold stored blood without trouble."),
  merit("Eat Food", 2, 2, "You can consume and appear to enjoy ordinary food and drink."),
  merit("High-Functioning Addict", 1, 1, "Feeding on your drug of choice grants a die to one Attribute group.", "Core"),

  /* --- Merits: mental & mystic ------------------------------------------ */
  merit("Common Sense", 1, 1, "The Storyteller flags obviously bad ideas before you commit."),
  merit("Concentration", 1, 1, "You shrug off distraction and penalties to focus.", "Players Guide"),
  merit("Eidetic Memory", 2, 2, "You recall detail with near-perfect accuracy.", "Players Guide"),
  merit("Language", 1, 5, "You are fluent in one additional language per dot."),
  merit("Time Sense", 1, 1, "You always know the time and how much has passed.", "Players Guide"),
  merit("Untouchable", 5, 5, "You can escape official notice for even serious Masquerade breaches.", "Players Guide"),
  merit("Tempered Will", 3, 3, "Sense mental Disciplines used on you and resist them once per session.", "Players Guide"),
  merit("Zealotry", 1, 3, "Faith steadies you; turn set successes into messy criticals for a cause."),
  merit("Unholy Will", 2, 4, "Your ties to dark powers strengthen supernatural resistance."),
  merit("Check the Trunk", 1, 1, "You keep useful gear close at hand for the unexpected.", "Core"),

  /* --- Merits: thin-blood ----------------------------------------------- */
  merit("Thin-Blood: Anarch Comrades", 1, 1, "An Anarch faction accepts and shelters you.", "Core"),
  merit("Thin-Blood: Catenating Blood", 1, 1, "Your blood can form Blood Bonds and create ghouls.", "Core"),
  merit("Thin-Blood: Day Drinker", 1, 1, "Sunlight strips your powers but no longer burns you.", "Core"),
  merit("Thin-Blood: Discipline", 1, 1, "You have learned a single dot of a full Discipline.", "Core"),
  merit("Thin-Blood: Lifelike", 1, 1, "You keep a heartbeat, warmth, and can pass as living.", "Core"),
  merit("Thin-Blood: Thin-Blood Alchemist", 1, 1, "You can distill and use thin-blood alchemy formulae.", "Core"),
  merit("Thin-Blood: Vampiric Resilience", 1, 1, "You take damage like a full-blooded Kindred.", "Core"),

  /* --- Flaws: looks & bearing ------------------------------------------- */
  flaw("Ugly", 1, 1, "Your unfortunate looks impose a penalty on relevant social rolls."),
  flaw("Repulsive", 2, 2, "Deeply off-putting appearance imposes a larger social penalty."),
  flaw("Beacon of the Unholy", 2, 2, "True Faith and the divine sense you as unmistakably damned.", "Players Guide"),
  flaw("Stench", 1, 1, "A foul, clinging odor undermines your social efforts.", "Players Guide"),

  /* --- Flaws: feeding & the Blood --------------------------------------- */
  flaw("Prey Exclusion", 1, 1, "You refuse to feed from a chosen type of victim, risking Hunger."),
  flaw("Farmer", 2, 2, "You are loath to feed on humans and must feed on animals when able."),
  flaw("Organovore", 2, 2, "You must consume flesh or organs, not merely blood, to be sated."),
  flaw("Vein Tapper", 1, 1, "You can only feed on the unaware, the bound, or the unconscious.", "Companion"),
  flaw("Methuselah's Thirst", 1, 1, "Ordinary blood no longer fully satisfies your ancient Hunger."),
  flaw("Addiction", 1, 1, "You suffer until you feed on prey carrying your drug of choice.", "Core"),
  flaw("Hopeless Addiction", 2, 2, "A crippling craving inflicts heavy penalties when unsated.", "Players Guide"),
  flaw("Stake Bait", 2, 2, "Being staked destroys you outright rather than merely paralyzing."),
  flaw("Folkloric Bane", 1, 1, "A traditional item — garlic, silver, a symbol — harms you on contact.", "Core"),
  flaw("Folkloric Block", 1, 1, "A folk ward repels you unless you spend Willpower to cross it.", "Core"),
  flaw("Stigmata", 1, 1, "You bleed from the hands and brow when your Hunger runs high.", "Core"),

  /* --- Flaws: the Bond & the Beast -------------------------------------- */
  flaw("Bond Junkie", 1, 1, "You are especially susceptible to the pull of the Blood Bond."),
  flaw("Long Bond", 1, 1, "Your Blood Bonds linger and fade far more slowly than normal.", "Core"),
  flaw("Bondslave", 2, 2, "A single drink of another's blood is enough to bind you fully.", "Core"),
  flaw("Prey Exclusion (Children)", 1, 1, "You will not feed on the young, whatever the cost."),
  flaw("Illiterate", 2, 2, "You cannot read or write, barring related knowledge rolls."),
  flaw("Archaic", 1, 1, "You cannot use modern technology and treat it as baffling.", "Core"),

  /* --- Flaws: reputation & ties ----------------------------------------- */
  flaw("Adversary", 1, 3, "A mortal individual or group actively works against you.", "Core"),
  flaw("Destitute", 1, 1, "You have no reliable income or assets to your name.", "Core"),
  flaw("Infamy", 1, 2, "A bad reputation drags on your standing among Kindred.", "Core"),
  flaw("Suspect", 1, 1, "One faction distrusts you, penalizing your dealings with it.", "Core"),
  flaw("Shunned", 2, 2, "A faction actively despises and excludes you.", "Core"),
  flaw("Dark Secret", 1, 1, "A ruinous hidden fact would undo you if it came to light.", "Core"),
  flaw("Known Blankbody", 1, 1, "Hunter and government databases flag you as an anomaly.", "Core"),
  flaw("Known Corpse", 1, 1, "People who knew you in life know that you died.", "Core"),

  /* --- Flaws: thin-blood ------------------------------------------------ */
  flaw("Thin-Blood: Baby Teeth", 1, 1, "You lack proper fangs and cannot easily bite to feed.", "Core"),
  flaw("Thin-Blood: Bestial Temper", 1, 1, "You are subject to frenzy like a full vampire.", "Core"),
  flaw("Thin-Blood: Clan Curse", 1, 1, "You suffer the Bane of a chosen clan.", "Core"),
  flaw("Thin-Blood: Dead Flesh", 1, 1, "Your body is visibly corpselike and hard to pass off as living.", "Core"),
  flaw("Thin-Blood: Mortal Frailty", 1, 1, "You cannot Rouse the Blood to mend your wounds.", "Core"),
  flaw("Thin-Blood: Shunned by the Anarchs", 1, 1, "The Anarch movement rejects and mistrusts you.", "Core"),
  flaw("Thin-Blood: Vitae Dependency", 1, 1, "You must regularly drink Kindred vitae to keep your powers.", "Core"),

  /* --- Loresheets ------------------------------------------------------- */
  // Core Rulebook
  lore("Cainite Heresy", "Ties to the secret vampiric heresy that reveres Caine as a dark messiah.", "Core"),
  lore("Golconda", "A pursuit of the fabled state of balance between the Beast and humanity.", "Core"),
  lore("The Bahari", "Membership in Lilith's dark cult, its rites, and its scattered devotees.", "Core"),
  lore("Descendant of Hardestadt", "Lineage tied to the storied Ventrue elder and his legacy.", "Core"),
  lore("Descendant of Helena", "Toreador descent from a Methuselah of beauty and influence.", "Core"),
  lore("Descendant of Tyler", "Brujah lineage of the icon who lit the Anarch Revolt.", "Core"),
  lore("Descendant of Xaviar", "Gangrel line of the Justicar who fled the Camarilla.", "Core"),
  lore("Descendant of Zelios", "Nosferatu lineage of a master architect of havens and mazes.", "Core"),
  lore("Theo Bell", "Association with the famous Brujah rebel and his cause.", "Core"),
  lore("The Circulatory System", "An Anarch blood-distribution network that keeps you fed.", "Core"),
  lore("Convention of Thorns", "Standing rooted in the founding treaty of the Camarilla.", "Core"),
  lore("The First Inquisition", "Hard-won knowledge of the old orders that hunted the Kindred.", "Core"),
  lore("The Week of Nightmares", "Survivor's lore of the night a clan's progenitor died.", "Core"),
  lore("Carna", "Ties to the rebel Tremere and her heterodox Blood Sorcery.", "Core"),
  lore("High Clan", "The prestige and privilege of the traditional ruling clans.", "Core"),
  lore("Low Clan", "Solidarity and grit among the disfavored, lower-status clans.", "Core"),

  // Camarilla & Anarch
  lore("Fatima al-Faqadi", "A deadly Banu Haqim assassin who owes or is owed favors.", "Camarilla"),
  lore("Fiorenza Savona", "Connection to a powerful Ventrue mover in elite mortal society.", "Camarilla"),
  lore("The Cult of Mithras", "Worship of the slumbering Ventrue Methuselah and his ancient power.", "Camarilla"),
  lore("Victoria Ash", "Ties to the famed Toreador seductress and her webs of intrigue.", "Camarilla"),
  lore("Salvador Garcia", "Association with the legendary leader of the Anarch Revolt.", "Anarch"),
  lore("Hesha Ruhadze", "Errands and relics from a Ministry serpent and hunter of artifacts.", "Anarch"),
  lore("The Church of Set", "Membership in the serpent faith of smugglers and corrupters.", "Anarch"),
  lore("Ruins of Carthage", "The Brujah dream of a fallen utopia and its buried relics.", "Anarch"),

  // Chicago by Night & Folios
  lore("The Cobweb", "Access to the Malkavian network of shared madness and insight.", "Chicago by Night"),
  lore("Descendant of Lodin", "Ventrue lineage of a fallen prince of Chicago.", "Chicago by Night"),
  lore("Descendant of Montano", "Lasombra descent from a master of Oblivion and shadow.", "Chicago by Night"),
  lore("The Labyrinth", "The run of the Nosferatu warren beneath the city.", "Chicago by Night"),
  lore("Kevin Jackson", "Alliance with the ruthless Ventrue power-broker and prince.", "Chicago by Night"),
  lore("Descendant of Menele", "Brujah lineage of a Methuselah locked in ancient rivalry.", "The Chicago Folios"),
  lore("Goblin Roads", "Knowledge of hidden spirit paths for swift, secret travel.", "The Chicago Folios"),
  lore("Kindred Dueling", "Standing in the formal circuit of Kindred duels and honor.", "The Chicago Folios"),

  // Let the Streets Run Red
  lore("Kindred Social Media Influencer", "Online fame turned into a feeding ground and a weapon.", "Let the Streets Run Red"),
  lore("Eletria", "Connection to a Toreador Methuselah of art and manipulation.", "Let the Streets Run Red"),
  lore("The Milwaukee Null Zone", "Lore of a dead zone where Disciplines fail to work.", "Let the Streets Run Red"),

  // Cults of the Blood Gods
  lore("La Famiglia Giovanni", "Ties to the Hecata's necromantic merchant dynasty.", "Cults of the Blood Gods"),
  lore("Bankers of Dunsirn", "A wealthy revenant banking family with cannibal appetites.", "Cults of the Blood Gods"),
  lore("Children of Tenochtitlan", "A Hecata line descended from Aztec priests of sacrifice.", "Cults of the Blood Gods"),
  lore("The Nation of Blood", "Zealous membership in the Church of Caine.", "Cults of the Blood Gods"),
  lore("Harbingers of Ashur", "An ancient death-cult lineage of prophecy and Oblivion.", "Cults of the Blood Gods"),
  lore("The Gorgons", "A venomous Hecata warrior-priestess bloodline.", "Cults of the Blood Gods"),

  // Children of the Blood
  lore("The Ashfinders", "Connection to Kindred who study — and chase — diablerie and torpor.", "Children of the Blood"),
  lore("Amaranthan", "Membership in a cult that hunts and punishes diablerists.", "Children of the Blood"),
  lore("The One True Way", "Backing from a dogmatic cult certain of its own doctrine.", "Children of the Blood"),
  lore("Little Siblings", "A support network of fellow neonates and broodmates.", "Children of the Blood"),

  // Fall of London
  lore("Court of Shadows", "Ties to London's veiled Kindred court and its schemes.", "Fall of London"),
  lore("London Under London", "Free passage through the tunnels beneath the old city.", "Fall of London"),
  lore("Operation Antigen", "Knowledge of a Second Inquisition campaign against the Kindred.", "Fall of London"),

  // Forbidden Religions, Blood Sigils, Gehenna War, In Memoriam
  lore("Blood Asceticism", "A discipline of denial that steels you against Hunger's pull.", "Forbidden Religions"),
  lore("Gehenna Cults", "Membership among those who court and await the end times.", "Forbidden Religions"),
  lore("Praepositor", "Ritual-master standing within a Tremere chantry.", "Blood Sigils"),
  lore("Descendant of al-Ashrad", "Banu Haqim lineage of a master of Blood Sorcery.", "Blood Sigils"),
  lore("Vienna Zero", "Ties to the shattered heartland of Tremere sorcery.", "Blood Sigils"),
  lore("The Eternal Arena", "Reputation in a Kindred gladiatorial circuit at the front.", "Gehenna War"),
  lore("Beckett", "The aid of the famed Gangrel scholar and investigator.", "Gehenna War"),
  lore("Descendant of Dracula", "Tzimisce lineage of the dread voivode himself.", "In Memoriam"),
  lore("The Order of Repentants", "A penitent order that supports the road back toward Humanity.", "In Memoriam"),
];
