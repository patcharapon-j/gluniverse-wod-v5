/**
 * Advantages compendium — Backgrounds, Merits, Flaws, and Loresheets.
 *
 * Compiled from the V5 line (Core Rulebook, Players Guide, Companion, Camarilla,
 * Anarch, Cults of the Blood Gods, Chicago by Night / Folios, Let the Streets
 * Run Red, Blood Sigils, Gehenna War, Blood-Stained Love, In Memoriam, Second
 * Inquisition). Category (kind) and dot range are mechanical facts; descriptions
 * are original one-line summaries. `value` is the entry's default/first dot,
 * `maxValue` the top of its range, `src` the book.
 *
 * NB: the schema caps dots at 5, so a range printed as reaching 6 (e.g. Allies)
 * is stored capped at 5. Loresheets are five-tier features stored as one 1–5
 * advantage. Some Merits/Flaws print with "no dot value" and are stored as 1.
 */

import { Adv } from "./_helpers.mjs";

const bg = (name, max, desc, src) => Adv({ kind: "background", name, value: 1, maxValue: max, desc, source: src });
const merit = (name, min, max, desc, src) => Adv({ kind: "merit", name, value: min, maxValue: max, desc, source: src });
const flaw = (name, min, max, desc, src) => Adv({ kind: "flaw", name, value: min, maxValue: max, desc, source: src });
const lore = (name, desc, src) => Adv({ kind: "loresheet", name, value: 1, maxValue: 5, desc, source: src });

export default [
  /* ===================================================================== *
   * BACKGROUNDS                                                           *
   * ===================================================================== */
  bg("Allies", 5, "A mortal individual or group who support you, rated by effectiveness and reliability.", "Core"),
  bg("Contacts", 3, "Mortals who can get you information, goods, or introductions.", "Core"),
  bg("Fame", 5, "Mortal renown that aids social reach and hunting but erodes the Masquerade.", "Core"),
  bg("Haven", 3, "A secure daytime resting place; each dot makes it more private and secure.", "Core"),
  bg("Herd", 5, "A pool of willing vessels you can feed on each week without a hunt.", "Core"),
  bg("Influence", 5, "Sway over a sphere of mortal society — politics, finance, or the street.", "Core"),
  bg("Mask", 2, "A fabricated mortal identity, complete with paperwork and accounts.", "Core"),
  bg("Mawla", 5, "An established Kindred mentor who takes you under their wing.", "Core"),
  bg("Resources", 5, "Reliable cash flow, from investments to a paycheck.", "Core"),
  bg("Retainers", 3, "Loyal mortal or ghoul followers who do your bidding.", "Core"),
  bg("Status", 5, "A name and standing built within your sect or faction.", "Core"),
  bg("Cult", 5, "A faith following that offers worship, cover, and material support.", "Cults of the Blood Gods"),

  /* --- Background support Merits ---------------------------------------- */
  merit("Influencer", 1, 1, "With Fame ••+, sway a fanbase or field as if you had Influence one below your Fame.", "Players Guide"),
  merit("Enduring Fame", 1, 1, "With Fame •••+, stardom never leaves you; Fame lost in a story recovers next story.", "Players Guide"),
  merit("Zeroed", 1, 1, "With a two-dot Mask, your past self is purged from every system.", "Players Guide"),
  merit("Cobbler", 1, 1, "With a two-dot Mask, you can craft or source further Masks (three days per dot).", "Players Guide"),
  merit("City Secrets", 1, 3, "Each dot is a piece of insider knowledge about a city's Kindred power structure.", "Players Guide"),

  /* --- Background Flaws ------------------------------------------------- */
  flaw("Enemy", 1, 3, "A mortal individual or group works against you, rated two below their effectiveness.", "Core"),
  flaw("Destitute", 1, 1, "No money, no home, and nothing of monetary value beyond yourself.", "Core"),
  flaw("Dark Secret", 1, 1, "A ruinous hidden fact known only to one or two motivated enemies.", "Core"),
  flaw("Infamy", 1, 3, "You did something atrocious and others know it.", "Core"),
  flaw("Banned From", 1, 3, "You are barred from a city, scaled by its size.", "Players Guide"),
  flaw("Disliked", 1, 1, "Lose one die on Social tests with groups outside your loyal followers.", "Core"),
  flaw("Despised", 2, 2, "A group or region actively works to ruin your plans.", "Core"),
  flaw("Known Corpse", 1, 1, "People know you died recently and react accordingly on sight.", "Core"),
  flaw("Known Blankbody", 2, 2, "Your details sit in agency databases; the Inquisition can flag you as a vampire.", "Core"),
  flaw("Stalkers", 1, 1, "You attract obsessive hangers-on; be rid of one and another appears.", "Core"),
  flaw("Suspect", 1, 1, "A sect distrusts you; take a two-dice penalty on Social tests with it.", "Core"),
  flaw("Shunned", 2, 2, "A sect despises you and works against you at any opportunity.", "Core"),
  flaw("Mortal Pretender", 1, 1, "You cling to a mortal life, unsettling Masquerade-minded Kindred.", "Let the Streets Run Red"),
  flaw("Adversary", 1, 3, "A Kindred goes out of their way to ruin you, rated two above a Mawla.", "Core"),
  flaw("Secret Master", 1, 1, "Your Mawla sets you quiet tasks that must be completed discreetly.", "Players Guide"),
  flaw("Shameful Childe", 1, 1, "You embraced a childe and then abandoned them.", "Players Guide"),
  flaw("Touchstone Embraced by Your Enemies", 2, 2, "A former Touchstone was Embraced and now runs with your enemies.", "Players Guide"),

  /* --- Haven Merits ----------------------------------------------------- */
  merit("Haven: Hidden Armory", 1, 3, "Each dot conceals one pistol and one long gun within the haven.", "Core"),
  merit("Haven: Cell", 1, 3, "A secure space to hold prisoners; scales with dots.", "Core"),
  merit("Haven: Watchmen", 1, 3, "Each dot supplies guards to patrol the haven.", "Core"),
  merit("Haven: Laboratory", 1, 3, "A workspace that adds dice to a Science, Technology, or Alchemy specialty.", "Core"),
  merit("Haven: Library", 1, 3, "Adds dice to an Academics, Investigation, or Occult specialty.", "Core"),
  merit("Haven: Location", 1, 1, "The haven's placement grants a two-dice bonus on relevant rolls.", "Core"),
  merit("Haven: Luxury", 1, 1, "Opulent furnishings add two dice to Social tests hosted inside.", "Core"),
  merit("Haven: Postern", 1, 3, "A secret exit; each dot adds a die to evade surveillance nearby.", "Core"),
  merit("Haven: Security System", 1, 3, "Each dot adds a die to resist unwelcome intrusion.", "Core"),
  merit("Haven: Warding", 1, 3, "Occult wards add dice to resist supernatural scrying and entry.", "Core"),
  merit("Haven: Surgery", 1, 1, "A fitted surgery adds two dice to relevant medical tests done inside.", "Core"),
  merit("Haven: Holy Ground", 1, 1, "Cult significance lets you summon cultists to defend the haven once per story.", "Cults of the Blood Gods"),
  merit("Haven: Shrine", 1, 3, "A shrine adds dice to preparing or obtaining Ritual and Ceremony ingredients.", "Cults of the Blood Gods"),
  merit("Haven: Business Establishment", 2, 3, "The haven doubles as a business — income at the cost of exposure.", "Players Guide"),
  merit("Haven: Furcus", 1, 3, "Built on a vein of power; each dot adds a die to Rituals or Ceremonies there.", "Players Guide"),
  merit("Haven: Machine Shop", 1, 3, "Each dot adds a die to Craft and machinery-related tests.", "Players Guide"),
  merit("Haven: Mobile", 1, 3, "A vehicle haven — car, van, boat, or plane — sized by dots.", "Let the Streets Run Red"),
  merit("Haven: Armored", 1, 1, "A mobile haven with reinforced panels, glass, and tires.", "Let the Streets Run Red"),
  merit("Haven: Smuggler's Stash", 1, 2, "A hidden compartment in a mobile haven; searches suffer +2 difficulty.", "Let the Streets Run Red"),
  merit("Haven: Spare Plates", 2, 2, "Swappable plates and identifiers for a mobile haven.", "Let the Streets Run Red"),

  /* --- Haven Flaws ------------------------------------------------------ */
  flaw("Haven: No Haven", 1, 1, "You must test each day to find a secure resting place.", "Core"),
  flaw("Haven: Creepy", 1, 1, "The haven unsettles mortals; take a two-dice Social penalty inside.", "Core"),
  flaw("Haven: Haunted", 1, 3, "A supernatural manifestation has taken hold of the haven.", "Core"),
  flaw("Haven: Compromised", 2, 2, "The haven is on a watchlist and may already have been raided.", "Core"),
  flaw("Haven: Shared", 1, 2, "The haven is not entirely yours — a co-tenant or Kindred landlord.", "Players Guide"),
  flaw("Haven: On the Rails", 1, 1, "A mobile haven whose route you do not control, like a train or ship.", "Let the Streets Run Red"),
  flaw("Haven: Temperamental", 1, 1, "A mobile haven that stalls on any failed Drive test until repaired.", "Let the Streets Run Red"),

  /* ===================================================================== *
   * MERITS & FLAWS — LOOKS                                                 *
   * ===================================================================== */
  merit("Beautiful", 2, 2, "Add one die to relevant Social pools.", "Core"),
  merit("Stunning", 4, 4, "Add two dice to relevant Social pools.", "Core"),
  merit("Semblance of the Methuselah", 1, 2, "Your face echoes a Methuselah, granting dice to impress those who know it.", "Players Guide"),
  merit("Famous Face", 1, 1, "You resemble a celebrity — two dice when it helps, two off when hiding.", "Players Guide"),
  merit("Ingénue", 1, 1, "You seem innocent; add two dice to deflect blame or suspicion.", "Players Guide"),
  merit("Remarkable Feature", 1, 1, "A rare, memorable trait — two dice with strangers, one off to disguise.", "Players Guide"),
  merit("Up All Night", 2, 4, "Treat Humanity as higher for Blush of Life, eating, and intimacy.", "Players Guide"),
  merit("Scene Kid", 1, 1, "Your style fits a subculture; add a die to Social pools within it.", "Let the Streets Run Red"),
  flaw("Ugly", 1, 1, "Lose one die from relevant Social pools.", "Core"),
  flaw("Repulsive", 2, 2, "Lose two dice from relevant Social pools.", "Core"),
  flaw("Stench", 1, 1, "A supernaturally foul odor costs dice on seduction and stealth.", "Players Guide"),
  flaw("Transparent", 1, 1, "You cannot lie convincingly and may take no dots in Subterfuge.", "Players Guide"),
  flaw("Unblinking Visage", 2, 2, "Treat Humanity as two lower when using Blush of Life or passing as living.", "Players Guide"),

  /* ===================================================================== *
   * MERITS & FLAWS — SUBSTANCE USE                                        *
   * ===================================================================== */
  merit("High-Functioning Addict", 1, 1, "Feeding on your drug adds a die to one Attribute category.", "Core"),
  flaw("Addiction", 1, 1, "Lose a die to all pools unless your last feeding held your drug.", "Core"),
  flaw("Hopeless Addiction", 2, 2, "Lose two dice to all pools unless your last feeding held your drug.", "Players Guide"),

  /* ===================================================================== *
   * MERITS & FLAWS — ARCHAIC (Ancilla or older)                           *
   * ===================================================================== */
  merit("Custodian of History", 1, 1, "+1 to Skill tests about a chosen period or figure of Kindred lore.", "Players Guide"),
  flaw("Living in the Past", 1, 1, "Outdated views color one or more of your Convictions.", "Players Guide"),
  flaw("Archaic", 2, 2, "You cannot use computers or phones; your Technology rating is 0.", "Core"),
  flaw("Grief Phobia", 1, 1, "Lose a die near a stimulus tied to a traumatically lost Touchstone.", "Players Guide"),
  flaw("Old Tricks", 1, 1, "All of your specialties must be archaic ones.", "Players Guide"),

  /* ===================================================================== *
   * MERITS & FLAWS — BONDING                                              *
   * ===================================================================== */
  merit("Bond Resistance", 1, 3, "Add one die per dot to resist Blood Bonds.", "Core"),
  merit("Short Bond", 2, 2, "Your Bonds weaken by two levels each month without reinforcement.", "Core"),
  merit("Unbondable", 5, 5, "You cannot be Blood Bonded.", "Core"),
  merit("Bonds of Fealty", 3, 3, "Your Dominate needs no eye contact on those bound to you (requires Dominate).", "Gehenna War"),
  merit("Enduring Bond", 1, 1, "Bonds you create weaken only every other month.", "Gehenna War"),
  flaw("Bond Junkie", 1, 1, "The Bond is sweeter to you; lose a die acting against it.", "Core"),
  flaw("Long Bond", 1, 1, "Your Bonds fade slowly, one level every three months.", "Core"),
  flaw("Bondslave", 2, 2, "A single drink fully bonds you, not three.", "Core"),
  flaw("Two Masters", 1, 1, "You are Blood Bound to two individuals at once.", "Blood-Stained Love"),

  /* ===================================================================== *
   * MERITS & FLAWS — FEEDING                                              *
   * ===================================================================== */
  merit("Bloodhound", 1, 1, "Sniff out a mortal's Resonance without tasting them.", "Core"),
  merit("Iron Gullet", 3, 3, "Feed on rancid, defractionated, or otherwise spoiled blood.", "Core"),
  merit("Vessel Recognition", 1, 1, "A Resolve + Awareness test tells if a mortal was recently fed upon.", "Players Guide"),
  merit("Drive-Thru", 1, 1, "Feed on the move; finish a hunt in minutes at +1 difficulty.", "Players Guide"),
  flaw("Prey Exclusion", 1, 1, "You cannot feed from a chosen group and take Stains if you do.", "Core"),
  flaw("Methuselah's Thirst", 1, 1, "Only supernatural blood can slake your Hunger to zero.", "Core"),
  flaw("Farmer", 2, 2, "Spend two Willpower to feed on human blood (Ventrue cannot take this).", "Core"),
  flaw("Organovore", 2, 2, "You slake only by consuming human flesh and organs.", "Companion"),
  flaw("Vein Tapper", 1, 1, "You feed only from the unaware, drugged, or unconscious.", "Players Guide"),
  flaw("Outdated Preference", 2, 2, "You must capture prey matching a preference, or spend Willpower to feed.", "Players Guide"),
  flaw("Resonance Sensitivity", 1, 1, "One Resonance triggers a unique compulsion in you.", "Players Guide"),
  flaw("Resonance Mimic", 2, 2, "A victim's memories bleed into you, penalizing you afterward.", "Players Guide"),
  flaw("Sloppy Feeder", 2, 2, "Your feeding leaves a telltale pattern that links your attacks.", "Players Guide"),
  flaw("Obvious Predator", 2, 2, "A predatory aura costs dice on hunting and calming pools; you cannot keep a Herd.", "Core"),

  /* ===================================================================== *
   * MERITS & FLAWS — MYTHIC                                               *
   * ===================================================================== */
  merit("Eat Food", 2, 2, "Consume food (no nourishment); it must be expelled before daysleep.", "Core"),
  merit("Cold Dead Hunger", 3, 3, "Add two dice to resist Hunger frenzy.", "Players Guide"),
  merit("Pack Diablerie", 2, 2, "You claim the soul in group diablerie and share its yield.", "Players Guide"),
  merit("Luck of the Devil", 4, 4, "Once per session, redirect a misfortune onto someone close to you.", "Players Guide"),
  merit("Nuit Mode", 2, 2, "Your body keeps new haircuts and modifications instead of reverting each night.", "Players Guide"),
  merit("Object of Power", 1, 3, "A rare item granting rerolls, ritual bonuses, or premonitions of harm.", "Players Guide"),
  merit("Ley Line Leach", 1, 1, "Travel along ancient paths negates a Rouse Check on arrival.", "Let the Streets Run Red"),
  merit("Persistent Blush", 3, 3, "A single Blush of Life lasts a full week.", "Let the Streets Run Red"),
  flaw("Folkloric Bane", 1, 1, "A mythic object — silver, garlic — deals Aggravated damage on contact.", "Core"),
  flaw("Folkloric Block", 1, 1, "You must spend Willpower or retreat from a mythic ward.", "Core"),
  flaw("Stigmata", 1, 1, "You bleed from hands, feet, and brow at Hunger 4.", "Core"),
  flaw("Stake Bait", 2, 2, "A stake through the heart brings Final Death, not paralysis.", "Core"),
  flaw("Starving Decay", 2, 2, "At Hunger 3+ your body visibly withers, penalizing Physical and Social tests.", "Players Guide"),
  flaw("Cursed Object", 1, 1, "Once per session a successful test must be rerolled.", "Players Guide"),
  flaw("Twice Cursed", 2, 2, "You bear your clan's variant Bane in addition to its normal Bane.", "Players Guide"),
  flaw("Resistant Blush", 1, 1, "Roll Blush of Life Rouse Checks twice and take the worse.", "Let the Streets Run Red"),
  flaw("Land Locked", 1, 1, "You must pass a Fear Frenzy test to board a boat or plane.", "Let the Streets Run Red"),
  flaw("Corpse Flesh", 1, 1, "You cannot use Blush of Life.", "Let the Streets Run Red"),

  /* ===================================================================== *
   * MERITS & FLAWS — PSYCHOLOGICAL                                        *
   * ===================================================================== */
  merit("Unholy Will", 2, 4, "Add dice and shrug off damage when contesting those with True Faith.", "Core"),
  merit("Zealotry", 1, 3, "Once per session per dot, turn a Conviction-aligned success into a messy critical.", "Core"),
  merit("Penitence", 1, 5, "Once per session, take Superficial Health damage to heal Superficial Willpower.", "Players Guide"),
  merit("Soothed Beast", 1, 1, "With an obsession SPC, ignore one Bestial or Messy Critical per session.", "Blood-Stained Love"),
  merit("False Love", 1, 1, "Near an obsession SPC, treat Humanity as one higher for mortal pursuits.", "Blood-Stained Love"),
  flaw("Beacon of Profanity", 1, 1, "Any mortal with True Faith can sense your presence.", "Core"),
  flaw("Crisis of Faith", 1, 1, "On a bestial failure, take a point of Superficial Willpower damage.", "Players Guide"),
  flaw("Horrible Scars of Penitence", 1, 1, "Ritual scarring counts as Repulsive outside your cult.", "Players Guide"),
  flaw("Groveling Worm", 2, 2, "You must scourge yourself each session or take Aggravated Willpower damage.", "Players Guide"),

  /* ===================================================================== *
   * MERITS & FLAWS — MISCELLANEOUS                                        *
   * ===================================================================== */
  merit("Linguistics", 1, 5, "Each dot lets you read, write, and speak one more language.", "Core"),
  merit("Check the Trunk", 1, 1, "A ready cache of tools adds two dice to Preparation rolls.", "Core"),
  merit("Side Hustler", 2, 2, "Once per session, obtain an item or access as if you had Resources 2.", "Players Guide"),
  merit("Tempered Will", 3, 3, "Sense Dominate or Presence used on you and add two resist dice once per session.", "Players Guide"),
  merit("Untouchable", 5, 5, "Once per story, escape all official punishment for a destroying crime.", "Players Guide"),
  merit("Mystic of the Void", 1, 2, "Count as knowing an Oblivion Power for the purpose of learning Ceremonies.", "Players Guide"),
  flaw("Knowledge Hungry", 1, 1, "You must resist chasing a chosen forbidden topic when it appears.", "Players Guide"),
  flaw("Prestation Debts", 1, 1, "You owe boons; the holder keeps a die of Social leverage over you.", "Players Guide"),
  flaw("Risk-Taker", 1, 1, "A novel temptation costs you two dice until you indulge it or the scene ends.", "Players Guide"),
  flaw("Weak-Willed", 2, 2, "You cannot use active resistance against mental sway even when aware of it.", "Players Guide"),

  /* ===================================================================== *
   * MERITS & FLAWS — BLOOD TIES                                           *
   * ===================================================================== */
  merit("Consanguineous Sense", 2, 2, "Detect whether another Kindred shares your direct bloodline.", "Players Guide"),
  merit("Consanguineous Influence", 2, 2, "Bonus dice for mental Disciplines against your clan and close lineage.", "Players Guide"),
  merit("Sins of the Father", 2, 3, "You leave no evidence when diablerizing your own lineage.", "Players Guide"),
  flaw("Blatant Diablerist", 1, 1, "Detection powers always reveal your diablerie, even on a failure.", "Players Guide"),
  flaw("Inherited Bane", 2, 2, "You carry another clan's Bane in addition to your own.", "Players Guide"),

  /* ===================================================================== *
   * FLAWS — CONTAGION                                                     *
   * ===================================================================== */
  flaw("Disease Vector", 1, 1, "Feeding on the sick always infects you, and you pass it to the next vessel.", "Players Guide"),
  flaw("Plaguebringer", 1, 2, "Your vitae carries an incurable disease, passed through your bite.", "Players Guide"),

  /* ===================================================================== *
   * INGRAINED DISCIPLINE FLAWS (buy deeper powers at a cost; no rating)   *
   * ===================================================================== */
  flaw("Untamed (Animalism)", 1, 1, "Failing to Ride the Wave in frenzy inflicts two unmitigable Stains.", "Players Guide"),
  flaw("Daymares (Auspex)", 1, 1, "Make two Rouse Checks instead of one when you wake each night.", "Players Guide"),
  flaw("Sanguinary Animism (Blood Sorcery)", 1, 1, "Take a two-dice Social and Mental penalty in the scene after feeding.", "Players Guide"),
  flaw("Breakdown (Celerity)", 1, 1, "Take Aggravated Health damage when a Celerity Rouse Check fails.", "Players Guide"),
  flaw("Blunt (Dominate)", 1, 1, "You cannot spend Willpower to reroll a Social test.", "Players Guide"),
  flaw("Scar Tissue (Fortitude)", 1, 1, "Injuries you mend remain visible on your flesh for a day.", "Players Guide"),
  flaw("Faded (Obfuscate)", 1, 1, "Roll one fewer die on Remorse tests.", "Players Guide"),
  flaw("Monstrous (Oblivion)", 1, 1, "Treat your Humanity as three lower for appearance and Social pools.", "Players Guide"),
  flaw("Killer Instinct (Potence)", 1, 1, "Roll for Fury frenzy when a Potence Rouse Check fails.", "Players Guide"),
  flaw("Egomaniac (Presence)", 1, 1, "Roll for Fury frenzy on a messy critical or lost Presence contest.", "Players Guide"),
  flaw("Stasis (Protean)", 1, 1, "A failed Protean Rouse Check leaves your reversion incomplete.", "Players Guide"),

  /* ===================================================================== *
   * MERITS & FLAWS — CAITIFF ONLY                                         *
   * ===================================================================== */
  merit("Favored Blood", 4, 4, "Buy any Discipline without first tasting a vampire who has it.", "Players Guide"),
  merit("Mark of Caine", 2, 2, "Two dice to cow Caine-fearing Kindred; foil diablerie against you.", "Players Guide"),
  merit("Mockingbird", 3, 3, "For a night, wield a Discipline of a vampire whose blood you drank.", "Players Guide"),
  merit("Sun-Scarred", 5, 5, "Survive the first turn of sunlight; treat further sun as Superficial.", "Players Guide"),
  merit("Uncle Fangs", 3, 3, "You have a local thin-blood coterie who treat you as an ally.", "Players Guide"),
  flaw("Caitiff: Befouling Vitae", 2, 2, "Any mortal you Embrace or drain to death rises as a wight.", "Players Guide"),
  flaw("Caitiff: Clan Curse", 2, 2, "You suffer a chosen clan's Bane at halved severity.", "Players Guide"),
  flaw("Debt Peon", 2, 2, "You owe boons to a high-status vampire who keeps finding new leverage.", "Players Guide"),
  flaw("Liquidator", 1, 1, "Take two dice off Social pools against thin-bloods, save Intimidation.", "Players Guide"),
  flaw("Muddled Blood", 1, 1, "You must drink from a possessor before buying dots in a Discipline.", "Players Guide"),
  flaw("Walking Omen", 2, 2, "Divination points to you as the source of misfortune.", "Players Guide"),
  flaw("Word-Scarred", 1, 1, "Ancient vampiric text is written across your body.", "Players Guide"),

  /* ===================================================================== *
   * MERITS & FLAWS — THIN-BLOOD ONLY                                      *
   * ===================================================================== */
  merit("Thin-Blood: Anarch Comrades", 1, 1, "An Anarch group befriends you as a one-dot Anarch Mawla.", "Core"),
  merit("Thin-Blood: Camarilla Contact", 1, 1, "A Camarilla member uses you as a one-dot Camarilla Mawla.", "Core"),
  merit("Thin-Blood: Catenating Blood", 1, 1, "You can form Blood Bonds and Embrace other thin-bloods.", "Core"),
  merit("Thin-Blood: Day Drinker", 1, 1, "You walk in daylight, though it halves Health and strips your powers.", "Core"),
  merit("Thin-Blood: Discipline Affinity", 1, 1, "A natural knack for one Discipline; gain a dot in it.", "Core"),
  merit("Thin-Blood: Lifelike", 1, 1, "You keep a heartbeat, can eat, and pass medical checks at night.", "Core"),
  merit("Thin-Blood: Thin-Blood Alchemist", 1, 1, "Gain a dot and one formula of Thin-Blood Alchemy.", "Core"),
  merit("Thin-Blood: Vampiric Resilience", 1, 1, "You take damage like a full vampire.", "Core"),
  merit("Thin-Blood: Abhorrent Blood", 1, 1, "Vampires must spend Willpower each turn to drink from you.", "Players Guide"),
  merit("Thin-Blood: Faith-Proof", 1, 1, "You are too close to mortality for True Faith to affect you.", "Players Guide"),
  merit("Thin-Blood: Low Appetite", 1, 1, "Waking at low Hunger, roll the Rouse Check twice and take the best.", "Players Guide"),
  merit("Thin-Blood: Lucid Dreamer", 1, 1, "Once per session, glean a clue from the previous night's rest.", "Players Guide"),
  merit("Thin-Blood: Mortality's Mien", 1, 1, "Your nature hides from auras; two dice to seem mortal.", "Players Guide"),
  merit("Thin-Blood: Swift Feeder", 1, 1, "Slake a Hunger and lick the wound closed in a single turn, once per scene.", "Players Guide"),
  flaw("Thin-Blood: Shunned by the Anarchs", 1, 1, "The Anarchs reject you and may hand you to the Camarilla.", "Core"),
  flaw("Thin-Blood: Branded by the Camarilla", 1, 1, "A painful, unhealable brand marks what you are.", "Core"),
  flaw("Thin-Blood: Bestial Temper", 1, 1, "You frenzy under the normal full-vampire rules.", "Core"),
  flaw("Thin-Blood: Clan Curse", 1, 1, "You suffer a clan's Bane at severity 1.", "Core"),
  flaw("Thin-Blood: Vitae Dependency", 1, 1, "Drink vampire vitae weekly or lose all vampiric powers.", "Core"),
  flaw("Thin-Blood: Dead Flesh", 1, 1, "Medical checks read you as dead; a die off face-to-face Social tests.", "Core"),
  flaw("Thin-Blood: Baby Teeth", 1, 1, "You lack fangs sharp enough to break skin.", "Core"),
  flaw("Thin-Blood: Mortal Frailty", 1, 1, "You mend like a mortal and cannot Rouse the Blood to heal.", "Core"),
  flaw("Thin-Blood: Heliophobia", 1, 1, "You fear sunlight like a full vampire, risking terror frenzy.", "Players Guide"),
  flaw("Thin-Blood: Night Terrors", 1, 1, "Once per session, a terror robs you of a die for the scene.", "Players Guide"),
  flaw("Thin-Blood: Plague Bearer", 1, 1, "You still catch mortal illnesses, healed only by feeding to Hunger 0.", "Players Guide"),
  flaw("Thin-Blood: Sloppy Drinker", 1, 1, "A failed feeding test leaves a ragged, Masquerade-threatening wound.", "Players Guide"),
  flaw("Thin-Blood: Sun-Faded", 1, 1, "Alchemy and Disciplines fail in sunlight and suffer indoors by day.", "Players Guide"),
  flaw("Thin-Blood: Supernatural Tell", 1, 1, "Other supernaturals spot you easily; lose two Stealth dice against them.", "Players Guide"),
  flaw("Thin-Blood: Twilight Presence", 1, 1, "Mortals and Kindred alike find you off-putting; a die off Social pools.", "Players Guide"),
  flaw("Thin-Blood: Unending Hunger", 1, 1, "You slake one Hunger less when feeding, once per scene.", "Players Guide"),

  /* ===================================================================== *
   * MERITS & FLAWS — GHOUL ONLY                                           *
   * ===================================================================== */
  merit("Ghoul: Blood Empathy", 2, 2, "You feel when your regnant is in danger or needs you.", "Players Guide"),
  merit("Ghoul: Unseemly Aura", 2, 2, "Your aura reads as Kindred rather than mortal.", "Players Guide"),
  flaw("Ghoul: Baneful Blood", 1, 2, "You suffer the Bane of your first domitor's clan.", "Players Guide"),
  flaw("Ghoul: Crone's Curse", 2, 2, "You appear a decade older, reducing your Health track by one.", "Players Guide"),
  flaw("Ghoul: Distressing Fangs", 1, 1, "You grew Kindred-like fangs; a die off Social pools with mortals.", "Players Guide"),

  /* ===================================================================== *
   * MERITS & FLAWS — CULTS                                                *
   * ===================================================================== */
  merit("Apocryphal Texts", 1, 1, "You hold a cult leader's writings; two dice on applicable Intelligence rolls.", "Cults of the Blood Gods"),
  merit("Inspired Artist", 2, 2, "Cult art in your work penalizes onlookers resisting fellow cultists.", "Cults of the Blood Gods"),
  merit("Traveling Preacher", 2, 2, "Your spread message reduces Second Inquisition difficulty by one.", "Cults of the Blood Gods"),
  flaw("Excommunicated", 1, 2, "Cast out of your cult, penalized or actively hunted by it.", "Cults of the Blood Gods"),
  flaw("Faithless", 2, 2, "A member for gain only; capped at level 2 for cult Rituals and Loresheets.", "Cults of the Blood Gods"),
  merit("Ashfinders: Memories of the Fallen", 2, 2, "Thin-bloods double the value of a rolled 10 on Ashe alchemy.", "Cults of the Blood Gods"),
  merit("Ashfinders: Streamer", 2, 2, "Once per story, call your fanbase to do something simple for you.", "Cults of the Blood Gods"),
  flaw("Ashfinders: Ashe Addiction", 2, 2, "A failed Ashe alchemy roll penalizes you for the rest of the session.", "Cults of the Blood Gods"),
  merit("Bahari: Gardener", 1, 5, "A congregation of the faith that functions as Herd for the Bahari.", "Cults of the Blood Gods"),
  merit("Bahari: Dark Mother's Song", 2, 2, "Three dice on Manipulation to draw others toward worship of Lilith.", "Cults of the Blood Gods"),
  merit("Church of Caine: Fire Resistant", 1, 1, "Downgrade fire's Aggravated damage during daysleep with a Rouse Check.", "Cults of the Blood Gods"),
  flaw("Church of Caine: Schism", 1, 1, "Lasombra suffer two dice off Social rolls with their own cult.", "Cults of the Blood Gods"),
  merit("Church of Set: Vigilant", 2, 2, "You know when you are being watched by non-supernatural means.", "Cults of the Blood Gods"),
  merit("Church of Set: Fixer", 2, 2, "Once per story, call in a favor or lean on a former client.", "Cults of the Blood Gods"),
  merit("Church of Set: Go to Ground", 1, 1, "Add two dice on rolls to evade pursuit.", "Cults of the Blood Gods"),
  flaw("Church of Set: False Alarm", 1, 1, "Every failed Awareness roll counts as a total failure.", "Cults of the Blood Gods"),
  merit("Cult of Shalim: Insidious Whispers", 2, 2, "Double a rolled 10 on Social rolls to undermine a Conviction.", "Cults of the Blood Gods"),
  merit("Cult of Shalim: Gematria", 1, 1, "You can encrypt and decrypt a coded cipher.", "Cults of the Blood Gods"),
  flaw("Cult of Shalim: Empty", 1, 1, "Your unnerving presence costs you two dice on Social rolls.", "Cults of the Blood Gods"),
  merit("Mithraic: Bull-Slayer", 3, 3, "Reroll up to three dice in an extended test once per scene.", "Cults of the Blood Gods"),
  merit("Mithraic: Bargainer", 1, 1, "Reduce the difficulty to assess a transaction by one.", "Cults of the Blood Gods"),
  flaw("Mithraic: Failed Initiate", 1, 1, "A guide interrupts your plans and demands you prove yourself.", "Cults of the Blood Gods"),
  merit("Nephilim: Archangel's Grace", 3, 3, "Swap Athletics and Performance for heavy-cardio actions.", "Cults of the Blood Gods"),
  flaw("Nephilim: Yearning", 1, 1, "Spend two Willpower to act against your absent master's wishes.", "Cults of the Blood Gods"),

  /* ===================================================================== *
   * COTERIE — CLAN MERITS & GENERAL ADVANTAGES                            *
   * ===================================================================== */
  merit("Coterie: Call to Purpose", 2, 2, "Banu Haqim: once per session, grant a coterie-mate a Willpower point.", "Companion"),
  merit("Coterie: Boot and Rally", 1, 1, "Brujah: once per session, a mate rerolls a failed Physical test.", "Companion"),
  merit("Coterie: Pack Tactics", 3, 3, "Gangrel: gain a die on Brawl or Melee attacks made together.", "Companion"),
  merit("Coterie: Ars Moriendi", 2, 2, "Hecata: once per session, mask a corpse the coterie killed.", "Companion"),
  merit("Coterie: At Any Cost", 2, 2, "Lasombra: once per session, add two successes as a messy critical.", "Companion"),
  merit("Coterie: Everything is Connected", 3, 3, "Malkavian: swap one skill for another on an info-gathering test.", "Companion"),
  merit("Coterie: Discerning", 1, 1, "The Ministry: learn an SPC's wants once a mate has spoken with them.", "Companion"),
  merit("Coterie: Contextual Contact", 2, 2, "Nosferatu: lend the coterie's best Contacts to an info-recovery test.", "Companion"),
  merit("Coterie: Cryptolect", 3, 3, "Ravnos: the coterie shares a coded language and hand signs.", "Companion"),
  merit("Coterie: Restraint", 3, 3, "Salubri: once per session, let a mate reroll their Hunger dice for free.", "Players Guide"),
  merit("Coterie: All Access", 1, 1, "Toreador: once per session, talk your way past bouncers into an event.", "Companion"),
  merit("Coterie: Multi-Level Lorekeeping", 2, 2, "Tremere: once per session, use another mate's loresheet.", "Companion"),
  merit("Coterie: Old-World Hospitality", 2, 2, "Tzimisce: mates regain extra Willpower daysleeping in your haven.", "Companion"),
  merit("Coterie: Kindred Legacies", 2, 2, "Ventrue: once per session, recall a met vampire's history.", "Companion"),
  merit("Coterie: Versatile Vitae", 2, 2, "Caitiff: lend a mate a Discipline power for a scene.", "Players Guide"),
  merit("Coterie: Mortal Heart", 2, 2, "Thin-blood: once per session, raise the coterie's Humanity for a scene.", "Players Guide"),
  merit("Coterie: Bolt Holes", 1, 3, "Each dot adds a die when the coterie flees pursuit or hides.", "Companion"),
  merit("Coterie: On Tap", 1, 3, "Add dice to hunt a chosen Resonance within the domain.", "Companion"),
  merit("Coterie: Privileged", 3, 3, "The coterie is exempt from punishment for certain crimes.", "Companion"),
  merit("Coterie: Transportation", 2, 2, "A small fleet of luxury vehicles and drivers on call.", "Companion"),
  flaw("Coterie: Bullies", 1, 1, "A bad reputation costs the coterie a die on Social pools with Kindred.", "Companion"),
  flaw("Coterie: Cursed", 1, 3, "The coterie suffers chosen Banes or Blocks outside its domain.", "Companion"),
  flaw("Coterie: Custodians", 2, 2, "The coterie owes duties whose failure costs Status.", "Companion"),
  flaw("Coterie: Targeted", 1, 1, "A hunter agency has breached the coterie; its Portillon is halved.", "Companion"),
  flaw("Coterie: Territorial", 1, 1, "Domain traits decay each week the coterie is absent.", "Companion"),
  flaw("Coterie: Under Siege", 1, 1, "Once per story, a rival can suppress a coterie trait or merit.", "Companion"),

  /* ===================================================================== *
   * LORESHEETS                                                            *
   * ===================================================================== */
  // Core Rulebook
  lore("The Bahari", "Membership in Lilith's cult, its rites, and its scattered devotees.", "Core"),
  lore("Theo Bell", "Ties to the Brujah rebel who slew Justicars and to the Anarch cause.", "Core"),
  lore("Cainite Heresy", "Standing in the secret church that reveres Caine as a dark messiah.", "Core"),
  lore("Carna", "Ties to the dissident Tremere House of Carna and her heterodox sorcery.", "Core"),
  lore("The Circulatory System", "An Anarch blood-trafficking network that keeps you fed and supplied.", "Core"),
  lore("Convention of Thorns", "Insider knowledge of the founding treaty of the Camarilla.", "Core"),
  lore("The First Inquisition", "Hard lore of the old hunters — and its bearing on the Second.", "Core"),
  lore("Golconda", "The pursuit of transcendence and the balance it offers against Hunger.", "Core"),
  lore("Descendant of Hardestadt", "Ventrue lineage of a founder of the Camarilla.", "Core"),
  lore("Descendant of Helena", "Toreador descent from a Methuselah of beauty and influence.", "Core"),
  lore("Sect War Veteran", "Reputation and contacts earned in the Camarilla–Sabbat wars.", "Core"),
  lore("The Trinity", "The legacy of vampiric Constantinople and the dream of its rebirth.", "Core"),
  lore("Jeanette/Therese Voerman", "Connection to the Malkavian sisters and their Asylum club.", "Core"),
  lore("The Week of Nightmares", "Survivor's lore of the nights a clan's progenitor died.", "Core"),
  lore("Rudi", "Ties to a Gangrel organizer of the downtrodden against the powerful.", "Core"),
  lore("Descendant of Tyler", "Brujah lineage of the icon who lit the Anarch Revolt.", "Core"),
  lore("Descendant of Zelios", "Nosferatu line of a master builder of havens, mazes, and ley lines.", "Core"),
  lore("Descendant of Vasantasena", "Malkavian lineage skilled at surviving and undoing Blood Bonds.", "Core"),
  lore("High Clan", "The privilege and command of the traditional ruling clans.", "Core"),
  lore("Low Clan", "The grit and solidarity of the disfavored, lower-status clans.", "Core"),
  lore("Ambrus Maropis", "Ties to a Ventrue fixer of security, identities, and access.", "Core"),
  lore("Carmelita Neillson", "Access to a Toreador historian's archives and interviews.", "Core"),
  lore("Fiorenza Savona", "A relationship with a powerful Ventrue mover in elite society.", "Core"),
  lore("Descendant of Karl Schrekt", "Tremere lineage of a hardline hunter of the supernatural.", "Core"),
  lore("Descendant of Xaviar", "Gangrel line of the Justicar who fled the Camarilla.", "Core"),

  // Anarch
  lore("Salvador Garcia", "Association with the legendary leader of the Anarch Revolt.", "Anarch"),
  lore("Agata Starek", "Ties to an Anarch broker of leverage, secrets, and hard-won blood.", "Anarch"),
  lore("Hesha Ruhadze", "Errands and relics from a Ministry hunter of ancient artifacts.", "Anarch"),
  lore("The Church of Set", "Membership in the serpent faith of smugglers and corrupters.", "Anarch"),
  lore("Ruins of Carthage", "The Brujah myth of a fallen utopia and its buried power.", "Anarch"),
  lore("Blood Plagued", "Knowledge of — or infection by — the plague that afflicts Kindred.", "Anarch"),
  lore("Anarch Revolt", "Deep roots in the uprisings against tyrant princes.", "Anarch"),

  // Camarilla
  lore("Fatima al-Faqadi", "Favors from a deadly Banu Haqim assassin of the Camarilla.", "Camarilla"),
  lore("Pure Ventrue Lineage", "An impeccable Ventrue pedigree of nobles, princes, and Methuselahs.", "Camarilla"),
  lore("The Cult of Mithras", "Standing in the cult of the slumbering Ventrue Methuselah.", "Camarilla"),
  lore("The Pyramid", "Rank and relationships within the Tremere hierarchy.", "Camarilla"),
  lore("Victoria Ash", "A shifting relationship with the famed Toreador seductress.", "Camarilla"),

  // Chicago by Night & Folios
  lore("The Cobweb", "Access to the Malkavian network of shared madness and insight.", "Chicago by Night"),
  lore("Descendant of Lodin", "Ventrue lineage of a fallen prince of Chicago.", "Chicago by Night"),
  lore("Descendant of Montano", "Lasombra descent from a master of Oblivion and shadow.", "Chicago by Night"),
  lore("The Labyrinth", "The run of the Nosferatu warren beneath the city.", "Chicago by Night"),
  lore("Kevin Jackson", "Alliance with the ruthless Ventrue prince and power-broker.", "Chicago by Night"),
  lore("Descendant of Menele", "Brujah lineage of a Methuselah locked in ancient rivalry.", "The Chicago Folios"),
  lore("Goblin Roads", "Knowledge of hidden spirit paths for swift, secret travel.", "The Chicago Folios"),
  lore("Kindred Dueling", "Standing in the formal circuit of Kindred duels and honor.", "The Chicago Folios"),

  // Let the Streets Run Red
  lore("Kindred Social Media Influencer", "Online fame turned into a feeding ground and a weapon.", "Let the Streets Run Red"),
  lore("Eletria", "Connection to a Toreador Methuselah of art and manipulation.", "Let the Streets Run Red"),
  lore("The Milwaukee Null Zone", "Lore of a dead zone where Disciplines fail to function.", "Let the Streets Run Red"),

  // Cults of the Blood Gods / Players Guide
  lore("La Famiglia Giovanni", "Ties to the Hecata's necromantic merchant dynasty.", "Cults of the Blood Gods"),
  lore("Bankers of Dunsirn", "A wealthy revenant banking family with cannibal appetites.", "Cults of the Blood Gods"),
  lore("Children of Tenochtitlan", "A Hecata line descended from Aztec priests of sacrifice.", "Cults of the Blood Gods"),
  lore("The Nation of Blood", "Zealous membership in the Church of Caine.", "Cults of the Blood Gods"),
  lore("Harbingers of Ashur", "An ancient death-cult lineage of prophecy and Oblivion.", "Cults of the Blood Gods"),
  lore("The Gorgons", "A venomous Hecata warrior-priestess bloodline.", "Cults of the Blood Gods"),

  // Children of the Blood
  lore("The Ashfinders", "Kindred who study — and chase — the mystery of diablerie and torpor.", "Children of the Blood"),
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
