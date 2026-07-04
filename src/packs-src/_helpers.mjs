/**
 * Compact builders for compendium source content.
 *
 * Content modules import these to emit *normalized* documents — objects shaped
 * `{ name, type, img?, system }` (Items) or `{ name, img?, pages }` (Journals).
 * `scripts/build-packs.mjs` adds the stable `_id` / `_key` wrapper and compiles
 * to LevelDB. Keeping the mechanical fields here lets the content read as terse
 * data tables.
 *
 * NB: descriptions are ORIGINAL summaries written for this system — factual
 * mechanics only (names, levels, costs, dice pools, prerequisites). No rulebook
 * prose is reproduced.
 */

/** Wrap plain text into a single HTML paragraph (empty string stays empty). */
export const p = (t) => (t ? `<p>${t}</p>` : "");

/** Join several plain strings as separate paragraphs. */
export const paras = (...ts) => ts.filter(Boolean).map((t) => `<p>${t}</p>`).join("");

const amalgamOf = (a) => {
  if (!a) return { discipline: "", level: 0 };
  return { discipline: a.discipline ?? "", level: a.level ?? 0 };
};

/** Discipline container (rated 0–5; powers reference it by its discipline key). */
export const D = (e) => ({
  name: e.name,
  type: "discipline",
  img: e.img ?? "icons/svg/aura.svg",
  system: {
    description: e.descHtml ?? p(e.desc),
    source: e.source ?? "V5",
    discipline: e.key,
    value: 0,
  },
});

/** A single Discipline power. */
export const Power = (e) => ({
  name: e.name,
  type: "power",
  img: e.img ?? "icons/svg/lightning.svg",
  system: {
    description: e.descHtml ?? p(e.desc),
    source: e.source ?? "V5",
    discipline: e.disc,
    parentDiscipline: "",
    level: e.level ?? 1,
    cost: e.cost ?? "",
    pool: e.pool ?? "",
    opposingPool: e.opp ?? "",
    duration: e.duration ?? "",
    amalgam: amalgamOf(e.amalgam),
  },
});

/** Blood Sorcery ritual. */
export const Ritual = (e) => ({
  name: e.name,
  type: "ritual",
  img: e.img ?? "icons/svg/book.svg",
  system: {
    description: e.descHtml ?? p(e.desc),
    source: e.source ?? "V5",
    level: e.level ?? 1,
    ingredients: e.ingredients ?? "",
    process: e.processHtml ?? p(e.process),
    pool: e.pool ?? "Intelligence + Blood Sorcery",
  },
});

/** Oblivion ceremony (same shape as a ritual). */
export const Ceremony = (e) => ({
  name: e.name,
  type: "ceremony",
  img: e.img ?? "icons/svg/skull.svg",
  system: {
    description: e.descHtml ?? p(e.desc),
    source: e.source ?? "V5",
    level: e.level ?? 1,
    ingredients: e.ingredients ?? "",
    process: e.processHtml ?? p(e.process),
    pool: e.pool ?? "Intelligence + Oblivion",
  },
});

const ADV_IMG = {
  merit: "icons/svg/upgrade.svg",
  flaw: "icons/svg/downgrade.svg",
  background: "icons/svg/castle.svg",
  loresheet: "icons/svg/scroll-old.svg",
};

/** Merit / Flaw / Background / Loresheet entry. */
export const Adv = (e) => ({
  name: e.name,
  type: "advantage",
  img: e.img ?? ADV_IMG[e.kind] ?? "icons/svg/upgrade.svg",
  system: {
    description: e.descHtml ?? p(e.desc),
    source: e.source ?? "V5",
    kind: e.kind ?? "merit",
    value: e.value ?? 1,
    maxValue: e.maxValue ?? e.value ?? 5,
    category: e.category ?? "",
  },
});

/** Weapon. */
export const Weapon = (e) => ({
  name: e.name,
  type: "weapon",
  img: e.img ?? "icons/svg/sword.svg",
  system: {
    description: e.descHtml ?? p(e.desc),
    source: e.source ?? "V5",
    damage: e.damage ?? 0,
    damageType: e.damageType ?? "superficial",
    pool: e.pool ?? "",
    range: e.range ?? "",
    concealment: e.concealment ?? "",
    quantity: 1,
    equipped: false,
  },
});

/** Armor. */
export const Armor = (e) => ({
  name: e.name,
  type: "armor",
  img: e.img ?? "icons/svg/shield.svg",
  system: {
    description: e.descHtml ?? p(e.desc),
    source: e.source ?? "V5",
    rating: e.rating ?? 0,
    type: e.type ?? "",
    penalty: e.penalty ?? 0,
    equipped: false,
  },
});

/** Generic gear / possession. */
export const Gear = (e) => ({
  name: e.name,
  type: "gear",
  img: e.img ?? "icons/svg/item-bag.svg",
  system: {
    description: e.descHtml ?? p(e.desc),
    source: e.source ?? "V5",
    quantity: e.quantity ?? 1,
    cost: e.cost ?? "",
    equipped: false,
  },
});

/** A JournalEntry with one or more text pages (and optional system flags). */
export const Journal = (e) => ({
  name: e.name,
  img: e.img,
  flags: e.flags,
  pages: (e.pages ?? []).map((pg, i) => ({
    name: pg.name,
    type: "text",
    title: { show: true, level: 1 },
    sort: (i + 1) * 100000,
    text: { format: 1, content: pg.content },
  })),
});
