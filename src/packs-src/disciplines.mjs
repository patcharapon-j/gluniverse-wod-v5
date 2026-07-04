/**
 * Disciplines & Powers compendium.
 *
 * One `discipline` container per Discipline plus its individual `power` items,
 * ordered by level. Fields are mechanical facts (level, Rouse cost, dice pool,
 * amalgam prerequisite); descriptions are original one-line functional
 * summaries — no rulebook prose.
 */

import { D, Power } from "./_helpers.mjs";

const AM = (discipline, level) => ({ discipline, level });

/* --- Discipline containers ------------------------------------------------ */
const disciplines = [
  D({ key: "animalism", name: "Animalism", desc: "Command over beasts and the vampire's own inner Beast." }),
  D({ key: "auspex", name: "Auspex", desc: "Preternaturally heightened senses and psychic perception." }),
  D({ key: "bloodSorcery", name: "Blood Sorcery", desc: "The manipulation of blood as an occult tool; enables Rituals." }),
  D({ key: "celerity", name: "Celerity", desc: "Supernatural speed and reflexes." }),
  D({ key: "dominate", name: "Dominate", desc: "Bending mortal and vampire minds to the user's will." }),
  D({ key: "fortitude", name: "Fortitude", desc: "Inhuman toughness and resistance to harm." }),
  D({ key: "obfuscate", name: "Obfuscate", desc: "Concealment, disguise, and passing unseen." }),
  D({ key: "oblivion", name: "Oblivion", desc: "Command of shadow and the restless dead; enables Ceremonies." }),
  D({ key: "potence", name: "Potence", desc: "Raw supernatural strength." }),
  D({ key: "presence", name: "Presence", desc: "Supernatural allure, dread, and command of emotion." }),
  D({ key: "protean", name: "Protean", desc: "Shapeshifting and adaptation of the body." }),
  D({ key: "thinBloodAlchemy", name: "Thin-Blood Alchemy", desc: "The thin-blood's craft of distilling blood into potent formulae." }),
];

/* --- Powers ---------------------------------------------------------------
 * Core Rulebook powers, plus additions from the wider V5 line (Players Guide,
 * Companion, Cults of the Blood Gods, Sabbat, Chicago by Night, Gehenna War).
 * `src` names the book; mechanical fields are functional summaries only.
 */
const powers = [
  // Animalism ------------------------------------------------------------
  Power({ disc: "animalism", name: "Bond Famulus", level: 1, cost: "Two Rouse Checks", pool: "Charisma + Animal Ken", desc: "Bond a single animal as a loyal, empowered companion." }),
  Power({ disc: "animalism", name: "Sense the Beast", level: 1, cost: "Free", pool: "Resolve + Animalism", desc: "Sense anger, hunger, and the supernatural Beast in those nearby." }),
  Power({ disc: "animalism", name: "Atavism", level: 1, cost: "One Rouse Check", pool: "Composure + Animalism", source: "Companion", desc: "Drive a nearby animal into a fear or rage frenzy." }),
  Power({ disc: "animalism", name: "Feral Whispers", level: 2, cost: "One Rouse Check", pool: "Manipulation + Animalism", desc: "Communicate with animals and summon or command a species." }),
  Power({ disc: "animalism", name: "Animal Messenger", level: 2, cost: "One Rouse Check", pool: "Manipulation + Animalism", amalgam: AM("auspex", 1), source: "Players Guide", desc: "Send a bonded animal to carry a message and relay its senses." }),
  Power({ disc: "animalism", name: "Scent of Prey", level: 2, cost: "One Rouse Check", pool: "Resolve + Animalism", source: "Sabbat", desc: "Catch the scent of mortals who witnessed a breach of the Masquerade." }),
  Power({ disc: "animalism", name: "Animal Succulence", level: 3, cost: "Free", desc: "Draw far greater sustenance and satisfaction from feeding on animals." }),
  Power({ disc: "animalism", name: "Quell the Beast", level: 3, cost: "One Rouse Check", pool: "Charisma + Animalism", opp: "Stamina + Resolve", desc: "Smother a target's drives, ending frenzy or numbing them to apathy." }),
  Power({ disc: "animalism", name: "Plague of Beasts", level: 3, cost: "One Rouse Check", pool: "Manipulation + Animalism", source: "Players Guide", desc: "Mark a victim so ordinary animals hound, shun, and unsettle them." }),
  Power({ disc: "animalism", name: "Unliving Hive", level: 3, cost: "Free", amalgam: AM("obfuscate", 2), desc: "House and command a swarm of vermin or insects within the body." }),
  Power({ disc: "animalism", name: "Subsume the Spirit", level: 4, cost: "One Rouse Check", pool: "Manipulation + Animalism", desc: "Possess an animal and pilot its body from afar." }),
  Power({ disc: "animalism", name: "Sway the Flock", level: 4, cost: "Two Rouse Checks", pool: "Composure + Animalism", source: "Players Guide", desc: "Bend the mood and behavior of a whole group of animals at once." }),
  Power({ disc: "animalism", name: "Animal Dominion", level: 5, cost: "Two Rouse Checks", pool: "Charisma + Animalism", desc: "Take absolute command of a large group of animals at once." }),
  Power({ disc: "animalism", name: "Drawing Out the Beast", level: 5, cost: "One Rouse Check", pool: "Wits + Animalism", opp: "Composure + Resolve", desc: "Cast one's own frenzy into a nearby victim, who rages in your place." }),

  // Auspex ---------------------------------------------------------------
  Power({ disc: "auspex", name: "Heightened Senses", level: 1, cost: "Free", pool: "Wits + Resolve", desc: "Sharpen all senses to supernatural acuity." }),
  Power({ disc: "auspex", name: "Sense the Unseen", level: 1, cost: "Free", pool: "Wits + Auspex", desc: "Detect the supernatural — the hidden, the cloaked, the spectral." }),
  Power({ disc: "auspex", name: "Unerring Pursuit", level: 1, cost: "One Rouse Check", pool: "Resolve + Auspex", opp: "Wits + Awareness", amalgam: AM("dominate", 1), source: "Players Guide", desc: "Mark a target through a reflection to track and observe them at a distance." }),
  Power({ disc: "auspex", name: "Premonition", level: 2, cost: "Free / One Rouse Check", pool: "Resolve + Auspex", desc: "Receive flashes of insight or warning about coming danger." }),
  Power({ disc: "auspex", name: "Panacea", level: 2, cost: "One Rouse Check", pool: "Composure + Auspex", amalgam: AM("fortitude", 1), source: "Companion", desc: "Soothe fear and frenzy in another and restore a little of their Willpower." }),
  Power({ disc: "auspex", name: "Reveal Temperament", level: 2, cost: "One Rouse Check", pool: "Intelligence + Auspex", amalgam: AM("bloodSorcery", 1), source: "Blood Sigils", desc: "Read the Resonance and temperament of blood or a mortal at a glance." }),
  Power({ disc: "auspex", name: "Scry the Soul", level: 3, cost: "One Rouse Check", pool: "Intelligence + Auspex", opp: "Composure + Subterfuge", desc: "Read a subject's aura to gauge mood, health, and supernatural nature." }),
  Power({ disc: "auspex", name: "Share the Senses", level: 3, cost: "One Rouse Check", pool: "Resolve + Auspex", desc: "Reach into another's senses and perceive what they perceive." }),
  Power({ disc: "auspex", name: "Spirit's Touch", level: 4, cost: "One Rouse Check", pool: "Intelligence + Auspex", desc: "Read the psychic impressions left on an object by those who handled it." }),
  Power({ disc: "auspex", name: "Clairvoyance", level: 5, cost: "One Rouse Check", pool: "Intelligence + Auspex", desc: "Extend perception across a wide, familiar area to gather information." }),
  Power({ disc: "auspex", name: "Possession", level: 5, cost: "Two Rouse Checks", pool: "Resolve + Auspex", opp: "Resolve + Intelligence", amalgam: AM("dominate", 3), desc: "Project into and seize control of a mortal's body." }),
  Power({ disc: "auspex", name: "Telepathy", level: 5, cost: "One Rouse Check", pool: "Resolve + Auspex", opp: "Wits + Subterfuge", desc: "Read surface thoughts and project your own into another mind." }),
  Power({ disc: "auspex", name: "Unburdening the Bestial Soul", level: 5, cost: "Two Rouse Checks", pool: "Composure + Auspex", amalgam: AM("dominate", 2), source: "Cults of the Blood Gods", desc: "Ease another's Beast, mending Stains and aiding recovery from trauma." }),

  // Blood Sorcery --------------------------------------------------------
  Power({ disc: "bloodSorcery", name: "Corrosive Vitae", level: 1, cost: "One Rouse Check", desc: "Make your Vitae caustic, eating through matter it touches." }),
  Power({ disc: "bloodSorcery", name: "A Taste for Blood", level: 1, cost: "Free", pool: "Resolve + Blood Sorcery", desc: "Learn traits about a victim — Resonance, Blood Potency, sickness — from a taste." }),
  Power({ disc: "bloodSorcery", name: "Shape the Sanguine Sacrament", level: 1, cost: "One Rouse Check", pool: "Manipulation + Blood Sorcery", source: "Players Guide", desc: "Shape spilled blood into images, shapes, or written messages." }),
  Power({ disc: "bloodSorcery", name: "Extinguish Vitae", level: 2, cost: "One Rouse Check", pool: "Intelligence + Blood Sorcery", opp: "Stamina + Composure", desc: "Raise a target's Hunger by burning away their Vitae." }),
  Power({ disc: "bloodSorcery", name: "Blood of Potency", level: 3, cost: "One Rouse Check", pool: "Resolve + Blood Sorcery", desc: "Temporarily raise your own Blood Potency for a scene." }),
  Power({ disc: "bloodSorcery", name: "Scorpion's Touch", level: 3, cost: "One Rouse Check", pool: "Strength + Blood Sorcery", opp: "Stamina + Occult", desc: "Turn your Vitae into a paralytic poison delivered by touch." }),
  Power({ disc: "bloodSorcery", name: "Extinguish the Fires of Wrath", level: 3, cost: "One Rouse Check", pool: "Composure + Blood Sorcery", source: "Sabbat", desc: "Calm the raging Beast in a frenzied Kindred nearby." }),
  Power({ disc: "bloodSorcery", name: "Theft of Vitae", level: 4, cost: "One Rouse Check", pool: "Wits + Blood Sorcery", opp: "Wits + Occult", desc: "Draw a victim's blood to yourself across a distance in a crimson arc." }),
  Power({ disc: "bloodSorcery", name: "Cauldron of Blood", level: 5, cost: "One Rouse Check + one Stain", pool: "Resolve + Blood Sorcery", opp: "Composure + Occult", desc: "Boil a victim's blood in their veins, inflicting grievous Aggravated harm." }),
  Power({ disc: "bloodSorcery", name: "Baal's Caress", level: 5, cost: "One Rouse Check", pool: "Strength + Blood Sorcery", source: "Sabbat", desc: "Coat a weapon in caustic Vitae that deals Aggravated damage." }),

  // Celerity -------------------------------------------------------------
  Power({ disc: "celerity", name: "Cat's Grace", level: 1, cost: "Free", desc: "Automatically keep your balance on any surface." }),
  Power({ disc: "celerity", name: "Rapid Reflexes", level: 1, cost: "Free", desc: "React with supernatural speed, ignoring penalties for hasty action." }),
  Power({ disc: "celerity", name: "Fleetness", level: 2, cost: "One Rouse Check", desc: "Add Celerity dice to Dexterity rolls and move at blurring speed." }),
  Power({ disc: "celerity", name: "Rush Job", level: 2, cost: "One Rouse Check", pool: "Dexterity + relevant Skill", source: "Players Guide", desc: "Perform a time-consuming manual task in a fraction of the time." }),
  Power({ disc: "celerity", name: "Blink", level: 3, cost: "One Rouse Check", pool: "Dexterity + Athletics", desc: "Cover a short distance almost instantly in a single surge." }),
  Power({ disc: "celerity", name: "Traversal", level: 3, cost: "One Rouse Check", pool: "Dexterity + Athletics", desc: "Run across water or up sheer surfaces for as long as your speed holds." }),
  Power({ disc: "celerity", name: "Weaving", level: 3, cost: "One Rouse Check", source: "Players Guide", desc: "Dodge with preternatural fluidity, adding Celerity to defense against attacks." }),
  Power({ disc: "celerity", name: "Blurred Momentum", level: 4, cost: "One Rouse Check", source: "Players Guide", desc: "Move so fast that weak attacks against you simply miss." }),
  Power({ disc: "celerity", name: "Draught of Elegance", level: 4, cost: "One Rouse Check", desc: "Grant your supernatural speed to another by feeding them your Vitae." }),
  Power({ disc: "celerity", name: "Unerring Aim", level: 4, cost: "One Rouse Check", amalgam: AM("auspex", 2), desc: "Perceive slowly enough to land a ranged attack with pinpoint accuracy." }),
  Power({ disc: "celerity", name: "Unseen Strike", level: 4, cost: "One Rouse Check", amalgam: AM("obfuscate", 3), source: "Players Guide", desc: "Strike from concealment at blurring speed as an undodgeable ambush." }),
  Power({ disc: "celerity", name: "Lightning Strike", level: 5, cost: "One Rouse Check", desc: "Attack first with unstoppable speed, striking before foes can react." }),
  Power({ disc: "celerity", name: "Split Second", level: 5, cost: "One Rouse Check", desc: "Bend the moment to perform one impossible action in the nick of time." }),

  // Dominate -------------------------------------------------------------
  Power({ disc: "dominate", name: "Cloud Memory", level: 1, cost: "Free", pool: "Charisma + Dominate", opp: "Wits + Resolve", desc: "Erase a victim's memory of the past few moments." }),
  Power({ disc: "dominate", name: "Compel", level: 1, cost: "Free", pool: "Charisma + Dominate", opp: "Intelligence + Resolve", desc: "Issue a single short command a victim obeys at once." }),
  Power({ disc: "dominate", name: "Slavish Devotion", level: 1, cost: "Free", amalgam: AM("fortitude", 1), source: "Players Guide", desc: "Harden your thralls' minds against the influence of anyone but you." }),
  Power({ disc: "dominate", name: "Mesmerize", level: 2, cost: "One Rouse Check", pool: "Manipulation + Dominate", opp: "Intelligence + Resolve", desc: "Implant a more complex, multi-step command in a victim's mind." }),
  Power({ disc: "dominate", name: "Dementation", level: 2, cost: "One Rouse Check", pool: "Manipulation + Dominate", opp: "Composure + Intelligence", amalgam: AM("obfuscate", 2), desc: "Stir madness, panic, and emotional turmoil in a target." }),
  Power({ disc: "dominate", name: "Domitor's Favor", level: 2, cost: "One Rouse Check", desc: "Make blood-bonded thralls find it far harder to defy your orders." }),
  Power({ disc: "dominate", name: "The Forgetful Mind", level: 3, cost: "One Rouse Check", pool: "Manipulation + Dominate", opp: "Intelligence + Resolve", desc: "Rewrite or fabricate a victim's memories wholesale." }),
  Power({ disc: "dominate", name: "Submerged Directive", level: 3, cost: "Free", desc: "Plant a dormant Mesmerize command that triggers on a set stimulus." }),
  Power({ disc: "dominate", name: "Rationalize", level: 4, cost: "Free", desc: "Make dominated victims believe their compelled acts were their own choice." }),
  Power({ disc: "dominate", name: "Ancestral Dominion", level: 4, cost: "One Rouse Check", pool: "Manipulation + Dominate", amalgam: AM("bloodSorcery", 1), source: "Chicago by Night", desc: "Command your own blood-descendants without word or eye contact." }),
  Power({ disc: "dominate", name: "Mass Manipulation", level: 5, cost: "One Rouse Check", desc: "Extend a Dominate power to affect an entire crowd at once." }),
  Power({ disc: "dominate", name: "Terminal Decree", level: 5, cost: "Free", desc: "Command victims to acts of self-harm they would normally refuse." }),
  Power({ disc: "dominate", name: "Tabula Rasa", level: 5, cost: "Two Rouse Checks", pool: "Manipulation + Dominate", opp: "Resolve + Intelligence", source: "Chicago by Night", desc: "Strip a mind bare, leaving a blank, pliant slate." }),

  // Fortitude ------------------------------------------------------------
  Power({ disc: "fortitude", name: "Resilience", level: 1, cost: "Free", desc: "Add Fortitude dice to resist and soak physical damage." }),
  Power({ disc: "fortitude", name: "Unswayable Mind", level: 1, cost: "Free", desc: "Bolster resistance against mental influence and coercion." }),
  Power({ disc: "fortitude", name: "Toughness", level: 2, cost: "One Rouse Check", desc: "Subtract Fortitude rating from Superficial physical damage taken." }),
  Power({ disc: "fortitude", name: "Enduring Beasts", level: 2, cost: "One Rouse Check", amalgam: AM("animalism", 1), desc: "Extend your durability to animals under your command." }),
  Power({ disc: "fortitude", name: "Obdurate", level: 2, cost: "One Rouse Check", pool: "Wits + Survival", amalgam: AM("potence", 2), source: "Players Guide", desc: "Plant your feet and shrug off knockdown and forced movement." }),
  Power({ disc: "fortitude", name: "Defy Bane", level: 3, cost: "One Rouse Check", desc: "Steel yourself to resist a source of Aggravated damage for a moment." }),
  Power({ disc: "fortitude", name: "Fortify the Inner Facade", level: 3, cost: "Free", desc: "Resist Auspex and other attempts to read your thoughts or aura." }),
  Power({ disc: "fortitude", name: "Seal the Beast's Maw", level: 3, cost: "One Rouse Check", source: "Players Guide", desc: "Suppress your own Hunger for a time, holding the Beast at bay." }),
  Power({ disc: "fortitude", name: "Draught of Endurance", level: 4, cost: "One Rouse Check", desc: "Grant your toughness to another by feeding them your Vitae." }),
  Power({ disc: "fortitude", name: "Flesh of Marble", level: 5, cost: "One Rouse Check", desc: "Turn your flesh nigh-impervious, ignoring the first source of damage each turn." }),
  Power({ disc: "fortitude", name: "Prowess from Pain", level: 5, cost: "One Rouse Check", desc: "Convert incoming injury into surges of physical might." }),

  // Obfuscate ------------------------------------------------------------
  Power({ disc: "obfuscate", name: "Cloak of Shadows", level: 1, cost: "Free", desc: "Blend into surroundings and go unnoticed while still and hidden." }),
  Power({ disc: "obfuscate", name: "Silence of Death", level: 1, cost: "Free", desc: "Mute all sound you make, moving in perfect quiet." }),
  Power({ disc: "obfuscate", name: "Ensconce", level: 1, cost: "One Rouse Check", amalgam: AM("auspex", 1), source: "Players Guide", desc: "Hide a small object on your person from sight and search." }),
  Power({ disc: "obfuscate", name: "Unseen Passage", level: 2, cost: "One Rouse Check", desc: "Remain unseen even while moving through an area." }),
  Power({ disc: "obfuscate", name: "Ghost in the Machine", level: 2, cost: "One Rouse Check", amalgam: AM("auspex", 1), source: "Companion", desc: "Extend your concealment to fool cameras and recording devices." }),
  Power({ disc: "obfuscate", name: "Mask of a Thousand Faces", level: 3, cost: "One Rouse Check", desc: "Wear an unremarkable, forgettable false face of your design." }),
  Power({ disc: "obfuscate", name: "Fata Morgana", level: 3, cost: "One Rouse Check", pool: "Manipulation + Obfuscate", amalgam: AM("presence", 1), source: "Players Guide", desc: "Weave an elaborate but static illusion for others to perceive." }),
  Power({ disc: "obfuscate", name: "Conceal", level: 4, cost: "One Rouse Check", amalgam: AM("auspex", 3), desc: "Hide an inanimate object, a vehicle, or even a small building." }),
  Power({ disc: "obfuscate", name: "Vanish", level: 4, cost: "One Rouse Check", desc: "Disappear from plain sight even while being actively watched." }),
  Power({ disc: "obfuscate", name: "Cloak the Gathering", level: 5, cost: "One Rouse Check", desc: "Extend your concealment to a group of companions." }),
  Power({ disc: "obfuscate", name: "Impostor's Guise", level: 5, cost: "One Rouse Check", desc: "Perfectly copy the face and voice of a specific person you have studied." }),

  // Oblivion -------------------------------------------------------------
  Power({ disc: "oblivion", name: "Shadow Cloak", level: 1, cost: "Free", desc: "Wrap yourself in shadow to intimidate or hide in darkness." }),
  Power({ disc: "oblivion", name: "Oblivion Sight", level: 1, cost: "Free", desc: "See in total darkness and glimpse the presence of the dead." }),
  Power({ disc: "oblivion", name: "Shadow Cast", level: 2, cost: "One Rouse Check", desc: "Summon and shape a pool of unnatural shadow you command." }),
  Power({ disc: "oblivion", name: "Arms of Ahriman", level: 2, cost: "One Rouse Check", amalgam: AM("potence", 2), desc: "Grow grasping tendrils of shadow to seize and crush at a distance." }),
  Power({ disc: "oblivion", name: "Aura of Decay", level: 3, cost: "One Rouse Check", desc: "Radiate rot that spoils food, sickens the living, and ages objects." }),
  Power({ disc: "oblivion", name: "Shadow Perspective", level: 3, cost: "One Rouse Check", desc: "Project your senses through a distant patch of shadow." }),
  Power({ disc: "oblivion", name: "Touch of Oblivion", level: 3, cost: "One Rouse Check", pool: "Strength + Oblivion", source: "Cults of the Blood Gods", desc: "Wither and decay a limb or organ with a single touch." }),
  Power({ disc: "oblivion", name: "Necrotic Plague", level: 4, cost: "One Rouse Check", pool: "Stamina + Oblivion", opp: "Stamina + Resolve", source: "Cults of the Blood Gods", desc: "Afflict a mortal with a lingering supernatural wasting sickness." }),
  Power({ disc: "oblivion", name: "Stygian Shroud", level: 4, cost: "One Rouse Check", desc: "Unleash smothering darkness that blinds and chokes those within." }),
  Power({ disc: "oblivion", name: "Umbrous Clutch", level: 4, cost: "One Rouse Check", pool: "Wits + Oblivion", source: "Cults of the Blood Gods", desc: "Use a victim's own shadow as a gate to seize and drag them." }),
  Power({ disc: "oblivion", name: "Shadow Step", level: 5, cost: "One Rouse Check", desc: "Step into one shadow and emerge from another nearby." }),
  Power({ disc: "oblivion", name: "Tenebrous Avatar", level: 5, cost: "Two Rouse Checks", desc: "Become living shadow, flowing and near-untouchable." }),
  Power({ disc: "oblivion", name: "Withering Spirit", level: 5, cost: "Two Rouse Checks", pool: "Resolve + Oblivion", opp: "Resolve + Occult", source: "Cults of the Blood Gods", desc: "Attack and erode a victim's very soul and will." }),

  // Potence --------------------------------------------------------------
  Power({ disc: "potence", name: "Lethal Body", level: 1, cost: "Free", desc: "Make unarmed strikes deal serious, even Aggravated, damage." }),
  Power({ disc: "potence", name: "Soaring Leap", level: 1, cost: "One Rouse Check", desc: "Jump extraordinary distances up, across, or down." }),
  Power({ disc: "potence", name: "Prowess", level: 2, cost: "One Rouse Check", desc: "Add Potence dice to feats of Strength and melee damage." }),
  Power({ disc: "potence", name: "Relentless Grasp", level: 2, cost: "One Rouse Check", source: "Players Guide", desc: "Lock an unbreakable grip on a foe, weapon, or handhold." }),
  Power({ disc: "potence", name: "Brutal Feed", level: 3, cost: "Free", desc: "Drain a victim of all their blood in a matter of seconds." }),
  Power({ disc: "potence", name: "Spark of Rage", level: 3, cost: "One Rouse Check", amalgam: AM("presence", 3), desc: "Provoke anger and violence in a crowd or individual." }),
  Power({ disc: "potence", name: "Uncanny Grip", level: 3, cost: "One Rouse Check", desc: "Cling to and crush surfaces, hanging from walls or ceilings." }),
  Power({ disc: "potence", name: "Wrecker", level: 3, cost: "One Rouse Check", source: "Players Guide", desc: "Double your effective Strength for feats of raw destruction." }),
  Power({ disc: "potence", name: "Draught of Might", level: 4, cost: "One Rouse Check", desc: "Grant your supernatural strength to another via your Vitae." }),
  Power({ disc: "potence", name: "Earthshock", level: 5, cost: "One Rouse Check", desc: "Strike the ground to loose a shockwave that fells those nearby." }),
  Power({ disc: "potence", name: "Fist of Caine", level: 5, cost: "One Rouse Check", desc: "Deliver a devastating blow of unstoppable, tearing force." }),

  // Presence -------------------------------------------------------------
  Power({ disc: "presence", name: "Awe", level: 1, cost: "One Rouse Check", pool: "Charisma + Presence", desc: "Become magnetically attractive and persuasive to those around you." }),
  Power({ disc: "presence", name: "Daunt", level: 1, cost: "Free", desc: "Radiate menace, pushing others to leave you be or back down." }),
  Power({ disc: "presence", name: "Eyes of the Serpent", level: 1, cost: "Free", pool: "Charisma + Presence", opp: "Wits + Composure", amalgam: AM("protean", 1), source: "Anarch", desc: "Hold a victim transfixed and immobile while they meet your gaze." }),
  Power({ disc: "presence", name: "Lingering Kiss", level: 2, cost: "Free", desc: "Make the euphoria of your bite intoxicating and memorable to mortals." }),
  Power({ disc: "presence", name: "Dread Gaze", level: 2, cost: "One Rouse Check", pool: "Charisma + Presence", opp: "Composure + Resolve", desc: "Terrify a single victim into flight or paralysis with a look." }),
  Power({ disc: "presence", name: "Entrancement", level: 3, cost: "One Rouse Check", pool: "Charisma + Presence", opp: "Composure + Wits", desc: "Bind a victim into infatuated devotion for a time." }),
  Power({ disc: "presence", name: "Irresistible Voice", level: 3, cost: "Free", amalgam: AM("dominate", 1), desc: "Make your spoken Dominate commands need only your voice to land." }),
  Power({ disc: "presence", name: "Melpominee", level: 3, cost: "One Rouse Check", pool: "Charisma + Performance", source: "Players Guide", desc: "Project your Presence through song to reach far or scattered listeners." }),
  Power({ disc: "presence", name: "Summon", level: 4, cost: "One Rouse Check", desc: "Call a person you have touched with Presence to come to you." }),
  Power({ disc: "presence", name: "Majesty", level: 5, cost: "One Rouse Check", desc: "Command such awe and dread that none dare act against you." }),
  Power({ disc: "presence", name: "Star Magnetism", level: 5, cost: "One Rouse Check", desc: "Project your Presence through cameras, screens, and broadcasts." }),

  // Protean --------------------------------------------------------------
  Power({ disc: "protean", name: "Eyes of the Beast", level: 1, cost: "Free", desc: "See perfectly in total darkness with the Beast's red gaze." }),
  Power({ disc: "protean", name: "Weight of the Feather", level: 1, cost: "Free", desc: "Make yourself weightless to avoid falls and pressure triggers." }),
  Power({ disc: "protean", name: "Feral Weapons", level: 2, cost: "One Rouse Check", desc: "Grow claws or fangs that deal Aggravated damage." }),
  Power({ disc: "protean", name: "Vicissitude", level: 2, cost: "One Rouse Check", pool: "Resolve + Protean", amalgam: AM("dominate", 2), source: "Players Guide", desc: "Sculpt your own flesh and bone into new, grotesque configurations." }),
  Power({ disc: "protean", name: "Earth Meld", level: 3, cost: "One Rouse Check", desc: "Sink into and rest within bare, natural earth." }),
  Power({ disc: "protean", name: "Shapechange", level: 3, cost: "One Rouse Check", desc: "Take the form of a human-sized animal such as a wolf." }),
  Power({ disc: "protean", name: "Fleshcrafting", level: 3, cost: "One Rouse Check", pool: "Resolve + Protean", opp: "Stamina + Resolve", amalgam: AM("dominate", 2), source: "Players Guide", desc: "Reshape the flesh and features of another living or unliving body." }),
  Power({ disc: "protean", name: "Metamorphosis", level: 4, cost: "One Rouse Check", desc: "Assume the shape of a smaller creature like a bat or a rat." }),
  Power({ disc: "protean", name: "Horrid Form", level: 4, cost: "One Rouse Check", amalgam: AM("dominate", 2), source: "Players Guide", desc: "Twist into a towering, monstrous war-form built for slaughter." }),
  Power({ disc: "protean", name: "Mist Form", level: 5, cost: "One Rouse Check", desc: "Dissolve into a cloud of mist that drifts through the smallest gaps." }),
  Power({ disc: "protean", name: "The Unfettered Heart", level: 5, cost: "Free", desc: "Move your heart within your body, foiling a staking blow." }),
  Power({ disc: "protean", name: "One with the Land", level: 5, cost: "Two Rouse Checks", amalgam: AM("animalism", 2), source: "Players Guide", desc: "Meld into a wide stretch of your home territory and sense all within it." }),

  // Thin-Blood Alchemy ---------------------------------------------------
  Power({ disc: "thinBloodAlchemy", name: "Far Reach", level: 1, cost: "One Rouse Check", pool: "Resolve + Alchemy", desc: "Distillate: grip and move objects at a distance by force of will." }),
  Power({ disc: "thinBloodAlchemy", name: "Haze", level: 1, cost: "One Rouse Check", desc: "Distillate: conjure a concealing bank of fog around yourself." }),
  Power({ disc: "thinBloodAlchemy", name: "Envelop", level: 2, cost: "One Rouse Check", pool: "Resolve + Alchemy", desc: "Distillate: smother a target in a suffocating cloud." }),
  Power({ disc: "thinBloodAlchemy", name: "Profane Hieros Gamos", level: 2, cost: "One Rouse Check", source: "Players Guide", desc: "Distillate: reshape your appearance, features, and apparent sex." }),
  Power({ disc: "thinBloodAlchemy", name: "Defractionate", level: 3, cost: "One Rouse Check", desc: "Distillate: render stored or bagged blood drinkable to a vampire." }),
  Power({ disc: "thinBloodAlchemy", name: "Airborne Momentum", level: 3, cost: "One Rouse Check", source: "Players Guide", desc: "Distillate: gain limited flight for a short time." }),
  Power({ disc: "thinBloodAlchemy", name: "Profane Hieristics", level: 4, cost: "One Rouse Check", desc: "Distillate: temporarily desanctify a warded or hallowed place." }),
  Power({ disc: "thinBloodAlchemy", name: "Awaken the Sleeper", level: 5, cost: "One Rouse Check", desc: "Distillate: rouse another vampire forcibly from daytime slumber." }),
];

export default [...disciplines, ...powers];
