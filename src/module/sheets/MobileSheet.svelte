<script lang="ts">
  /**
   * Touch-first mobile player sheet — an "action sheet" dashboard, not a long
   * scroll of trait lists. Mounted in place of the full Vampire / Mortal sheet
   * on phone clients (see svelte-sheets.ts).
   *
   * Layout: a sticky compact header (portrait, name, hunger/humanity, live
   * health & willpower tracks) over a segmented one-column body:
   *   Actions   — quick-roll chips, V5 checks, disciplines/powers, weapons
   *   Traits    — attributes + skills (trained-only by default), tap to roll
   *   Gear      — weapons / armor / gear (+ rituals & ceremonies)
   *   Character — identity, humanity, BP/resonance, advantages, bonds,
   *               convictions, XP, biography, effects
   * A floating "Roll" button opens a slide-up bottom drawer with a two-step
   * attribute × skill picker that seeds the regular RollDialog.
   */
  import { slide, fly, fade } from "svelte/transition";
  import {
    ATTRIBUTES,
    SKILLS,
    CLANS,
    PREDATOR_TYPES,
    RESONANCES,
    RESONANCE_INTENSITIES,
  } from "../config.ts";
  import { label, prettify } from "../components/labels.ts";
  import DotRating from "../components/DotRating.svelte";
  import DamageTrack from "../components/DamageTrack.svelte";
  import Portrait from "../components/Portrait.svelte";
  import ItemControls from "../components/ItemControls.svelte";
  import EffectsPanel from "../components/EffectsPanel.svelte";
  import { openRollDialog, rollPower, rollDiscipline, rollWeapon } from "../apps/RollDialogApp.ts";
  import { openXpDialog } from "../apps/XpDialogApp.ts";
  import { createItem, editItem, deleteItem } from "../apps/actor-items.ts";
  import { pickImage } from "../apps/image.ts";
  import { openChatArtConfig } from "../apps/ChatArtConfigApp.ts";
  import { openBuilder } from "../apps/BuilderApp.ts";
  import { rouseCheck, remorseCheck } from "../dice/checks.ts";
  import { openFrenzyDialog } from "../dice/frenzy.ts";
  import { clanBane, clanCompulsion } from "../vtm/clans.ts";
  import { HUMANITY_INFO, bloodPotencyInfo } from "../vtm/lore.ts";
  import { FEEDING_SOURCES, computeFeeding, applyFeeding } from "../vtm/feeding.ts";
  import { cardHeroHTML } from "../dice/chat.ts";
  import { actorChatArt } from "../dice/chat-art.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    doc: any;
    snap: any;
    app: any;
  }
  let { doc, snap, app }: Props = $props();

  const sys = $derived(snap.system);
  const items = $derived(snap.items as any[]);
  const editable = $derived(snap.editable as boolean);
  const isVampire = $derived(doc.type === "vampire");
  const isGhoul = $derived(doc.type === "ghoul");

  // --- edit mode (mirrors the full sheets' play/edit toggle) ----------------
  let editMode = $state(false);
  const edit = $derived(editMode && editable);

  // --- items ----------------------------------------------------------------
  const disciplines = $derived(items.filter((i) => i.type === "discipline"));
  const rituals = $derived(items.filter((i) => i.type === "ritual"));
  const ceremonies = $derived(items.filter((i) => i.type === "ceremony"));
  const formulas = $derived(items.filter((i) => i.type === "formula"));
  const weapons = $derived(items.filter((i) => i.type === "weapon"));
  const armor = $derived(items.filter((i) => i.type === "armor"));
  const gear = $derived(items.filter((i) => i.type === "gear"));
  const rites = $derived([...rituals, ...ceremonies, ...formulas]);
  // Vampires key powers to a parent Discipline item; mortals/ghouls key them to
  // the discipline slug — mirror both full sheets' groupings.
  const powersFor = (d: any) =>
    items.filter(
      (i) =>
        i.type === "power" &&
        (isVampire ? i.system.parentDiscipline === d.id : i.system.discipline === d.system.discipline),
    );

  const ADV_GROUPS = [
    { kind: "background", label: "Backgrounds" },
    { kind: "merit", label: "Merits" },
    { kind: "flaw", label: "Flaws" },
    { kind: "loresheet", label: "Loresheets" },
  ] as const;
  const advOf = (kind: string) =>
    items.filter((i) => i.type === "advantage" && (i.system.kind ?? "merit") === kind);
  const advCount = $derived(items.filter((i) => i.type === "advantage").length);

  const xpSpent = $derived(
    (sys.xp?.history ?? [])
      .filter((e: any) => !e.undone)
      .reduce((sum: number, e: any) => sum + (e.cost ?? 0), 0),
  );

  const bane = $derived(isVampire && sys.clan ? clanBane(sys.clan) : "");
  const compulsion = $derived(isVampire && sys.clan ? clanCompulsion(sys.clan) : "");
  const baneSeverity = $derived(sys.baneSeverity ?? 0);
  const humanityInfo = $derived(HUMANITY_INFO[Math.max(0, Math.min(10, sys.humanity?.value ?? 0))]!);
  const bpInfo = $derived(bloodPotencyInfo(sys.bloodPotency ?? 0));

  // Ghoul regnant link.
  const regnant = $derived.by(() => {
    const uuid = sys.bloodBond?.regnantUuid;
    if (!uuid) return null;
    try {
      return (globalThis as any).fromUuidSync?.(uuid) ?? null;
    } catch {
      return null;
    }
  });

  // --- tabs -----------------------------------------------------------------
  type Tab = "act" | "traits" | "gear" | "char";
  let tab: Tab = $state("act");
  const TABS: { id: Tab; label: string }[] = [
    { id: "act", label: "Actions" },
    { id: "traits", label: "Traits" },
    { id: "gear", label: "Gear" },
    { id: "char", label: "Character" },
  ];

  let openDisc: Record<string, boolean> = $state({});
  let expanded: Record<string, boolean> = $state({});
  let openSect: Record<string, boolean> = $state({ identity: true });
  const reveal = (k: string) => (expanded[k] = !expanded[k]);
  const sect = (k: string) => (openSect[k] = !openSect[k]);

  // --- document edits -------------------------------------------------------
  function up(path: string, value: unknown) {
    if (!editable) return;
    doc.update({ [path]: value });
  }
  function upItem(id: string, path: string, value: unknown) {
    if (!editable) return;
    doc.items.get(id)?.update({ [path]: value });
  }
  const setHunger = (i: number) => up("system.hunger", sys.hunger === i + 1 ? i : i + 1);
  const setHumanity = (i: number) => up("system.humanity.value", sys.humanity.value === i + 1 ? i : i + 1);
  const bumpStain = (d: number) =>
    up("system.humanity.stains", Math.max(0, Math.min(10, (sys.humanity?.stains ?? 0) + d)));
  const setDrinks = (i: number) =>
    up("system.bloodBond.drinks", (sys.bloodBond?.drinks ?? 0) === i + 1 ? i : i + 1);

  // Convictions (array on system, same shape as the full sheet).
  const addConviction = () =>
    up("system.convictions", [...(sys.convictions ?? []), { conviction: "", touchstone: "" }]);
  const updateConviction = (i: number, field: "conviction" | "touchstone", value: string) =>
    up(
      "system.convictions",
      (sys.convictions ?? []).map((c: any, idx: number) => (idx === i ? { ...c, [field]: value } : c)),
    );
  const removeConviction = (i: number) =>
    up("system.convictions", (sys.convictions ?? []).filter((_: any, idx: number) => idx !== i));

  // Blood bonds (vampire).
  const addBond = () =>
    up("system.bonds", [...(sys.bonds ?? []), { name: "", actorUuid: "", rating: 1, kind: "thrall" }]);
  const updateBond = (i: number, field: string, value: unknown) =>
    up(
      "system.bonds",
      (sys.bonds ?? []).map((b: any, idx: number) => (idx === i ? { ...b, [field]: value } : b)),
    );
  const removeBond = (i: number) =>
    up("system.bonds", (sys.bonds ?? []).filter((_: any, idx: number) => idx !== i));
  function bondActor(uuid: string): any {
    if (!uuid) return null;
    try {
      return (globalThis as any).fromUuidSync?.(uuid) ?? null;
    } catch {
      return null;
    }
  }

  // --- feeding (vampire) ----------------------------------------------------
  const feedOptions = $derived(
    FEEDING_SOURCES.map((s) => ({
      src: s,
      result: computeFeeding(sys.hunger ?? 0, sys.bloodPotency ?? 0, s.id),
    })),
  );
  async function feed(sourceId: string): Promise<void> {
    if (!editable) return;
    const r = await applyFeeding(doc, sourceId);
    const src = FEEDING_SOURCES.find((s) => s.id === sourceId);
    const summary = r.blockedReason
      ? `<span class="gl-feed-blocked">${r.blockedReason}</span>`
      : `Hunger <b>${r.before} → ${r.after}</b>${r.slaked ? ` <span class="gl-feed-slaked">(slaked ${r.slaked})</span>` : ""}`;
    const feedHero = cardHeroHTML({
      actorName: snap.name,
      flavor: `Feeds — ${src?.label ?? sourceId}`,
      img: snap.img,
      artTransform: actorChatArt(doc),
      compact: true,
    });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: doc }),
      content: `<div class="gl-card gl-feed-card">
        ${feedHero}
        <div class="gl-card-body"><div class="gl-feed-body">${summary}</div></div>
      </div>`,
    });
    closeDrawer();
  }

  // --- bottom drawer --------------------------------------------------------
  type Drawer = null | "pool" | "feed";
  let drawer: Drawer = $state(null);
  let pickAttr: string | null = $state(null);
  let pickSkill: string | null = $state(null);
  let pickAttr2: string | null = $state(null);
  let skillFilter = $state("");

  function openPoolDrawer() {
    pickAttr = null;
    pickSkill = null;
    pickAttr2 = null;
    skillFilter = "";
    drawer = "pool";
  }
  function closeDrawer() {
    drawer = null;
  }
  function choosePair(kind: "skill" | "attr", key: string) {
    if (kind === "skill") {
      pickSkill = pickSkill === key ? null : key;
      if (pickSkill) pickAttr2 = null;
    } else {
      pickAttr2 = pickAttr2 === key ? null : key;
      if (pickAttr2) pickSkill = null;
    }
  }
  const attrVal = (k: string) => sys.attributes?.[k]?.value ?? 0;
  const skillVal = (k: string) => sys.skills?.[k]?.value ?? 0;
  const poolPreview = $derived(
    (pickAttr ? attrVal(pickAttr) : 0) +
      (pickSkill ? skillVal(pickSkill) : 0) +
      (pickAttr2 ? attrVal(pickAttr2) : 0),
  );
  const poolLabel = $derived(
    [
      pickAttr && label("Attributes", pickAttr),
      pickSkill && label("Skills", pickSkill),
      pickAttr2 && label("Attributes", pickAttr2),
    ]
      .filter(Boolean)
      .join(" + "),
  );
  // After a roll leaves this sheet, the suite module may auto-collapse the
  // window so the player sees the 3D dice — always close the drawer first.
  function confirmPool() {
    if (!pickAttr) return;
    openRollDialog(doc, {
      attribute: pickAttr,
      skill: pickSkill ?? undefined,
      secondAttribute: pickAttr2 ?? undefined,
    });
    closeDrawer();
  }

  const attrRows = Object.entries(ATTRIBUTES) as [string, readonly string[]][];
  const skillRows = Object.entries(SKILLS) as [string, readonly string[]][];
  const filteredSkills = (keys: readonly string[]) =>
    keys.filter((k) => label("Skills", k).toLowerCase().includes(skillFilter.trim().toLowerCase()));

  // Quick-roll chips: common V5 pools, one tap → RollDialog preseeded.
  const QUICK_POOLS: { a: string; s: string }[] = [
    { a: "strength", s: "brawl" },
    { a: "dexterity", s: "athletics" },
    { a: "dexterity", s: "stealth" },
    { a: "wits", s: "awareness" },
    { a: "charisma", s: "persuasion" },
    { a: "manipulation", s: "subterfuge" },
    { a: "resolve", s: "investigation" },
    { a: "composure", s: "firearms" },
  ];

  // --- skills display -------------------------------------------------------
  let showAllSkills = $state(false);
  const trainedOnly = (keys: readonly string[]) =>
    showAllSkills ? [...keys] : keys.filter((k) => skillVal(k) > 0);

  const rollAttr = (k: string) => openRollDialog(doc, { attribute: k });
  const rollSkill = (k: string) => openRollDialog(doc, { skill: k });

  /**
   * Bottom clearance for viewport-fixed chrome (FAB / drawer). The suite
   * module's mobile tab bar occupies the bottom 72px of the screen (it stamps
   * `gl-mobile` on <body>); without the suite there is nothing to clear.
   */
  const dockOffset = document.body.classList.contains("gl-mobile") ? 72 : 0;
  const PIPS = [0, 1, 2, 3, 4];
</script>

<div class="gl-mobile-sheet" role="region" aria-label="Mobile character sheet" style="--m-dock:{dockOffset}px">
  <!-- V5-style read-only dot pips (● per rating point) for the pool picker. -->
  {#snippet pips(val: number)}
    <span class="m-pick-pips" aria-label={`Rating ${val}`}>
      {#each PIPS as i (i)}<i class="m-pick-pip" class:on={i < val}></i>{/each}
    </span>
  {/snippet}

  <!-- ============ sticky compact header ============ -->
  <header class="m-hdr">
    <div class="m-hdr-top">
      <Portrait img={snap.img} name={snap.name} editable={edit} onedit={() => pickImage(doc)} />
      <div class="m-id">
        <div class="m-eyebrow">
          {isVampire ? "Kindred" : isGhoul ? "Ghoul" : "Mortal"}
          {#if isVampire && sys.clan}· {prettify(sys.clan)}{/if}
        </div>
        <div class="m-name">{snap.name}</div>
        <div class="m-badges">
          {#if isVampire}
            <div class="m-diamonds" role="group" aria-label="Hunger">
              {#each Array.from({ length: 5 }, (_, i) => i) as i (i)}
                <span
                  class="m-dia"
                  class:on={i < (sys.hunger ?? 0)}
                  role="button"
                  tabindex="0"
                  aria-label={`Hunger ${i + 1}`}
                  onclick={() => setHunger(i)}
                  onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setHunger(i))}
                ></span>
              {/each}
            </div>
          {/if}
          {#if sys.humanity}
            <button class="m-hum-chip" onclick={() => ((tab = "char"), (openSect["humanity"] = true))} title="Humanity — edit in Character">
              <span class="m-hum-k">Hum</span>
              <span class="m-hum-v">{sys.humanity.value}</span>
              {#if sys.humanity.stains}<span class="m-hum-st">{sys.humanity.stains}✕</span>{/if}
            </button>
          {/if}
        </div>
      </div>
      <div class="m-hdr-btns">
        {#if editable}
          <button class="m-tool" class:on={editMode} onclick={() => (editMode = !editMode)} title="Toggle play / edit mode">
            {editMode ? "🔓" : "🔒"}
          </button>
        {/if}
        <button class="m-tool" onclick={() => app.glSetFullSheet?.(true)} title="Switch to the full desktop sheet for this session">⛶</button>
      </div>
    </div>
    <div class="m-tracks">
      <div class="m-trk">
        <span class="m-trk-h">HP</span>
        <DamageTrack
          superficial={sys.health.superficial}
          aggravated={sys.health.aggravated}
          max={sys.health.max}
          disabled={!editable}
          onchange={(v) =>
            editable && doc.update({ "system.health.superficial": v.superficial, "system.health.aggravated": v.aggravated })}
        />
      </div>
      <div class="m-trk">
        <span class="m-trk-h">WP</span>
        <DamageTrack
          superficial={sys.willpower.superficial}
          aggravated={sys.willpower.aggravated}
          max={sys.willpower.max}
          disabled={!editable}
          onchange={(v) =>
            editable && doc.update({ "system.willpower.superficial": v.superficial, "system.willpower.aggravated": v.aggravated })}
        />
      </div>
    </div>
    {#if sys.humanityImpaired}
      <div class="m-impair" role="alert">⚠ Impaired — stains overlap Humanity (−2 dice)</div>
    {/if}
    <!-- segmented control -->
    <nav class="m-tabs" aria-label="Sheet sections">
      {#each TABS as t (t.id)}
        <button class="m-tab" class:on={tab === t.id} onclick={() => (tab = t.id)} aria-pressed={tab === t.id}>
          {t.label}
        </button>
      {/each}
    </nav>
  </header>

  <!-- ============ ACTIONS ============ -->
  {#if tab === "act"}
    <div class="m-body">
      {#if editable}
        <div class="m-chips">
          {#each QUICK_POOLS as q (q.a + q.s)}
            <button
              class="m-chip"
              onclick={() => openRollDialog(doc, { attribute: q.a, skill: q.s })}
              title="Roll {label('Attributes', q.a)} + {label('Skills', q.s)}"
            >
              {label("Attributes", q.a).slice(0, 3)}+{label("Skills", q.s)}
              <b>{attrVal(q.a) + skillVal(q.s)}</b>
            </button>
          {/each}
        </div>
        <div class="m-checks">
          {#if isVampire}
            <button class="m-check" onclick={() => rouseCheck(doc)}>Rouse</button>
            <button class="m-check" onclick={() => (drawer = "feed")}>Feed</button>
            <button class="m-check" onclick={() => openFrenzyDialog(doc)}>Frenzy</button>
            <button class="m-check" onclick={() => remorseCheck(doc)}>Remorse</button>
          {/if}
        </div>
      {/if}

      {#if disciplines.length}
        <div class="m-sect-h">Disciplines</div>
        {#each disciplines as d (d.id)}
          <div class="m-disc">
            <div class="m-disc-h">
              <button class="m-disc-name" onclick={() => (openDisc[d.id] = !openDisc[d.id])} aria-expanded={!!openDisc[d.id]}>
                <span class="m-caret" class:open={openDisc[d.id]}>▸</span>
                {d.name}
              </button>
              <DotRating value={d.system.value} size={13} readonly={!edit} onchange={(n) => upItem(d.id, "system.value", n)} />
              {#if editable}
                <button class="m-roll" onclick={() => rollDiscipline(doc, d)} title="Roll {d.name}" aria-label="Roll {d.name}">⚄</button>
              {/if}
              {#if edit}<ItemControls onedit={() => editItem(doc, d.id)} ondelete={() => deleteItem(doc, d.id)} />{/if}
            </div>
            {#if openDisc[d.id]}
              {#each powersFor(d) as p (p.id)}
                <div class="m-pw-row">
                  <button class="m-row m-power" onclick={() => (editable ? rollPower(doc, p) : reveal(p.id))} title="Roll {p.name}">
                    <span class="m-pw-lvl">{p.system.level}</span>
                    <span class="m-row-name">{p.name}</span>
                    {#if p.system.pool}<span class="m-pw-pool">{p.system.pool}</span>{/if}
                  </button>
                  <button class="m-info" onclick={() => reveal(p.id)} aria-expanded={!!expanded[p.id]} aria-label="Details for {p.name}">ℹ</button>
                  {#if edit}<ItemControls onedit={() => editItem(doc, p.id)} ondelete={() => deleteItem(doc, p.id)} />{/if}
                </div>
                {#if expanded[p.id]}
                  <div class="m-detail" transition:slide={{ duration: 150 }}>
                    <div class="m-facts">
                      {#if p.system.cost}<span><b>Cost</b> {p.system.cost}</span>{/if}
                      {#if p.system.pool}<span><b>Pool</b> {p.system.pool}</span>{/if}
                      {#if p.system.opposingPool}<span><b>vs</b> {p.system.opposingPool}</span>{/if}
                    </div>
                    {#if p.system.description}<div class="m-detail-body">{@html p.system.description}</div>{/if}
                  </div>
                {/if}
              {/each}
              {#if edit}
                <button
                  class="m-add sub"
                  onclick={() =>
                    createItem(doc, "power", { "system.parentDiscipline": d.id, "system.discipline": d.system.discipline })}
                >+ Power</button>
              {/if}
            {/if}
          </div>
        {/each}
      {/if}
      {#if edit}
        <button class="m-add" onclick={() => createItem(doc, "discipline")}>+ Add Discipline</button>
      {/if}

      {#if weapons.length}
        <div class="m-sect-h">Weapons</div>
        {#each weapons as w (w.id)}
          <div class="m-pw-row">
            <button class="m-row" onclick={() => editable && rollWeapon(doc, w)} disabled={!editable} title="Roll {w.name}">
              <span class="m-row-name">{w.name}</span>
              <span class="m-pw-pool">{w.system.damage} {w.system.damageType === "aggravated" ? "agg" : "sup"}</span>
            </button>
            <button class="m-info" onclick={() => reveal("act-" + w.id)} aria-label="Details for {w.name}">ℹ</button>
          </div>
          {#if expanded["act-" + w.id]}
            <div class="m-detail" transition:slide={{ duration: 150 }}>
              <div class="m-facts">
                <span><b>Damage</b> {w.system.damage} {w.system.damageType}</span>
                {#if w.system.pool}<span><b>Pool</b> {w.system.pool}</span>{/if}
                {#if w.system.range}<span><b>Range</b> {w.system.range}</span>{/if}
              </div>
            </div>
          {/if}
        {/each}
      {/if}

      {#if rites.length || edit}
        <div class="m-sect-h">Rituals &amp; Ceremonies</div>
        {#each rites as r (r.id)}
          <div class="m-pw-row">
            <button class="m-row" onclick={() => reveal(r.id)} title="Show detail">
              <span class="m-row-name">{r.name}</span>
              <span class="m-pw-pool">{prettify(r.type)} {r.system.level}</span>
            </button>
            {#if edit}<ItemControls onedit={() => editItem(doc, r.id)} ondelete={() => deleteItem(doc, r.id)} />{/if}
          </div>
          {#if expanded[r.id] && r.system.description}
            <div class="m-detail" transition:slide={{ duration: 150 }}>
              <div class="m-detail-body">{@html r.system.description}</div>
            </div>
          {/if}
        {/each}
        {#if edit && isVampire}
          <div class="m-add-row">
            <button class="m-add" onclick={() => createItem(doc, "ritual")}>+ Ritual</button>
            <button class="m-add" onclick={() => createItem(doc, "ceremony")}>+ Ceremony</button>
            {#if sys.clan === "thinBlood"}
              <button class="m-add" onclick={() => createItem(doc, "formula")}>+ Formula</button>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  {/if}

  <!-- ============ TRAITS ============ -->
  {#if tab === "traits"}
    <div class="m-body">
      <div class="m-sect-h">Attributes <span class="m-hint">tap to roll</span></div>
      {#each attrRows as [cat, keys] (cat)}
        <div class="m-cat">{prettify(cat)}</div>
        {#each keys as k (k)}
          <div class="m-trait-row">
            <button class="m-row" onclick={() => rollAttr(k)} title="Roll {label('Attributes', k)}">
              <span class="m-row-name">{label("Attributes", k)}</span>
            </button>
            <DotRating value={sys.attributes[k].value} size={14} readonly={!edit} onchange={(n) => up(`system.attributes.${k}.value`, n)} />
          </div>
        {/each}
      {/each}

      <div class="m-sect-h m-skills-h">
        Skills
        <button class="m-mini-toggle" class:on={showAllSkills} onclick={() => (showAllSkills = !showAllSkills)} aria-pressed={showAllSkills}>
          {showAllSkills ? "All" : "Trained"}
        </button>
      </div>
      {#each skillRows as [cat, keys] (cat)}
        {@const shown = trainedOnly(keys)}
        {#if shown.length}
          <div class="m-cat">{prettify(cat)}</div>
          {#each shown as k (k)}
            <div class="m-trait-row">
              <button class="m-row" onclick={() => rollSkill(k)} title="Roll {label('Skills', k)}">
                <span class="m-row-name">
                  {label("Skills", k)}
                  {#if (sys.skills[k].specialties ?? []).length}
                    <i class="m-spec">({sys.skills[k].specialties.join(", ")})</i>
                  {/if}
                </span>
              </button>
              <DotRating value={sys.skills[k].value} size={14} readonly={!edit} onchange={(n) => up(`system.skills.${k}.value`, n)} />
            </div>
          {/each}
        {/if}
      {/each}
      {#if !showAllSkills}
        <button class="m-mini-toggle wide" onclick={() => (showAllSkills = true)}>Show all 27 skills…</button>
      {/if}
    </div>
  {/if}

  <!-- ============ GEAR ============ -->
  {#if tab === "gear"}
    <div class="m-body">
      <div class="m-sect-h">Weapons</div>
      {#if weapons.length === 0}<p class="m-empty">No weapons.</p>{/if}
      {#each weapons as w (w.id)}
        <div class="m-pw-row">
          <button
            class="m-eq-check"
            class:on={w.system.equipped}
            aria-label="Toggle equipped"
            disabled={!editable}
            onclick={() => upItem(w.id, "system.equipped", !w.system.equipped)}
          >✓</button>
          <button class="m-row" onclick={() => reveal(w.id)} title="Show detail">
            <span class="m-row-name">{w.name}</span>
            <span class="m-pw-pool">{w.system.damage} {w.system.damageType === "aggravated" ? "agg" : "sup"}</span>
          </button>
          {#if editable}<button class="m-roll" onclick={() => rollWeapon(doc, w)} aria-label="Roll {w.name}">⚄</button>{/if}
          {#if edit}<ItemControls onedit={() => editItem(doc, w.id)} ondelete={() => deleteItem(doc, w.id)} />{/if}
        </div>
        {#if expanded[w.id]}
          <div class="m-detail" transition:slide={{ duration: 150 }}>
            <div class="m-facts">
              <span><b>Damage</b> {w.system.damage} {w.system.damageType}</span>
              {#if w.system.pool}<span><b>Pool</b> {w.system.pool}</span>{/if}
              {#if w.system.range}<span><b>Range</b> {w.system.range}</span>{/if}
              {#if w.system.concealment}<span><b>Conceal</b> {w.system.concealment}</span>{/if}
              {#if (w.system.quantity ?? 1) !== 1}<span><b>Qty</b> {w.system.quantity}</span>{/if}
            </div>
            {#if w.system.description}<div class="m-detail-body">{@html w.system.description}</div>{/if}
          </div>
        {/if}
      {/each}

      <div class="m-sect-h">Armor</div>
      {#if armor.length === 0}<p class="m-empty">No armor.</p>{/if}
      {#each armor as a (a.id)}
        <div class="m-pw-row">
          <button
            class="m-eq-check"
            class:on={a.system.equipped}
            aria-label="Toggle equipped"
            disabled={!editable}
            onclick={() => upItem(a.id, "system.equipped", !a.system.equipped)}
          >✓</button>
          <button class="m-row" onclick={() => reveal(a.id)} title="Show detail">
            <span class="m-row-name">{a.name}</span>
            <span class="m-pw-pool">rating {a.system.rating}</span>
          </button>
          {#if edit}<ItemControls onedit={() => editItem(doc, a.id)} ondelete={() => deleteItem(doc, a.id)} />{/if}
        </div>
        {#if expanded[a.id]}
          <div class="m-detail" transition:slide={{ duration: 150 }}>
            <div class="m-facts">
              <span><b>Rating</b> {a.system.rating}</span>
              {#if a.system.type}<span><b>Type</b> {a.system.type}</span>{/if}
              {#if a.system.penalty}<span><b>Penalty</b> {a.system.penalty}</span>{/if}
            </div>
            {#if a.system.description}<div class="m-detail-body">{@html a.system.description}</div>{/if}
          </div>
        {/if}
      {/each}

      <div class="m-sect-h">Gear</div>
      {#if gear.length === 0}<p class="m-empty">No gear.</p>{/if}
      {#each gear as g (g.id)}
        <div class="m-pw-row">
          <span class="m-eq-qty">×{g.system.quantity}</span>
          <button class="m-row" onclick={() => reveal(g.id)} title="Show detail">
            <span class="m-row-name">{g.name}</span>
          </button>
          {#if edit}<ItemControls onedit={() => editItem(doc, g.id)} ondelete={() => deleteItem(doc, g.id)} />{/if}
        </div>
        {#if expanded[g.id]}
          <div class="m-detail" transition:slide={{ duration: 150 }}>
            <div class="m-facts">
              <span><b>Qty</b> {g.system.quantity}</span>
              {#if g.system.cost}<span><b>Cost</b> {g.system.cost}</span>{/if}
            </div>
            {#if g.system.description}<div class="m-detail-body">{@html g.system.description}</div>{/if}
          </div>
        {/if}
      {/each}

      {#if edit}
        <div class="m-add-row">
          <button class="m-add" onclick={() => createItem(doc, "weapon")}>+ Weapon</button>
          <button class="m-add" onclick={() => createItem(doc, "armor")}>+ Armor</button>
          <button class="m-add" onclick={() => createItem(doc, "gear")}>+ Gear</button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- ============ CHARACTER ============ -->
  {#if tab === "char"}
    <div class="m-body">
      <!-- identity -->
      <button class="m-acc" onclick={() => sect("identity")} aria-expanded={!!openSect["identity"]}>
        Identity <span class="m-caret" class:open={openSect["identity"]}>▸</span>
      </button>
      {#if openSect["identity"]}
        <div class="m-acc-body" transition:slide={{ duration: 150 }}>
          {#if edit}
            <label class="m-field">
              <span class="m-fk">Name</span>
              <input value={snap.name} onchange={(e) => doc.update({ name: e.currentTarget.value })} />
            </label>
          {/if}
          {#if isVampire}
            <label class="m-field">
              <span class="m-fk">Clan</span>
              <select value={sys.clan} disabled={!edit} onchange={(e) => up("system.clan", e.currentTarget.value)}>
                <option value="">—</option>
                {#each CLANS as c (c)}<option value={c}>{prettify(c)}</option>{/each}
              </select>
            </label>
            <label class="m-field">
              <span class="m-fk">Generation</span>
              <input type="number" min="3" max="16" value={sys.generation} disabled={!edit} onchange={(e) => up("system.generation", Number(e.currentTarget.value))} />
            </label>
            <label class="m-field">
              <span class="m-fk">Predator</span>
              <select value={sys.predator} disabled={!edit} onchange={(e) => up("system.predator", e.currentTarget.value)}>
                <option value="">—</option>
                {#each PREDATOR_TYPES as p (p)}<option value={p}>{prettify(p)}</option>{/each}
              </select>
            </label>
            <label class="m-field">
              <span class="m-fk">Sire</span>
              <input value={sys.sire ?? ""} disabled={!edit} onchange={(e) => up("system.sire", e.currentTarget.value)} />
            </label>
          {:else}
            <label class="m-field">
              <span class="m-fk">Concept</span>
              <input value={sys.details?.concept ?? ""} disabled={!edit} onchange={(e) => up("system.details.concept", e.currentTarget.value)} />
            </label>
          {/if}
          <label class="m-field">
            <span class="m-fk">Ambition</span>
            <input value={sys.details?.ambition ?? ""} disabled={!edit} onchange={(e) => up("system.details.ambition", e.currentTarget.value)} />
          </label>
          <label class="m-field">
            <span class="m-fk">Desire</span>
            <input value={sys.details?.desire ?? ""} disabled={!edit} onchange={(e) => up("system.details.desire", e.currentTarget.value)} />
          </label>
          {#if isVampire && sys.clan}
            <div class="m-bane">
              <div><b>Bane · Severity {baneSeverity}</b> {bane}</div>
              <div><b>Compulsion</b> {compulsion}</div>
            </div>
          {/if}
          {#if editable}
            <div class="m-add-row">
              {#if isVampire}<button class="m-add" onclick={() => openBuilder(doc)}>Builder</button>{/if}
              <button class="m-add" onclick={() => openChatArtConfig(doc)}>Chat Art</button>
            </div>
          {/if}
        </div>
      {/if}

      <!-- humanity -->
      <button class="m-acc" onclick={() => sect("humanity")} aria-expanded={!!openSect["humanity"]}>
        Humanity <span class="m-acc-val">{sys.humanity?.value ?? 0}</span>
        <span class="m-caret" class:open={openSect["humanity"]}>▸</span>
      </button>
      {#if openSect["humanity"]}
        <div class="m-acc-body" transition:slide={{ duration: 150 }}>
          <div class="m-humanity">
            {#each Array.from({ length: 10 }, (_, i) => i) as i (i)}
              <span
                class="m-ubox"
                class:on={i < (sys.humanity?.value ?? 0)}
                class:stain={i >= 10 - (sys.humanity?.stains ?? 0)}
                role="button"
                tabindex="0"
                aria-label={`Humanity ${i + 1}`}
                onclick={() => setHumanity(i)}
                onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setHumanity(i))}
              ></span>
            {/each}
          </div>
          {#if editable}
            <div class="m-stainctl">
              Stains
              <button class="m-mini-btn" onclick={() => bumpStain(-1)} aria-label="Decrease stains">–</button>
              <b>{sys.humanity?.stains ?? 0}</b>
              <button class="m-mini-btn" onclick={() => bumpStain(1)} aria-label="Increase stains">+</button>
              {#if isVampire}
                <button class="m-check sm" onclick={() => remorseCheck(doc)}>Remorse</button>
              {/if}
            </div>
          {/if}
          <p class="m-blurb">{humanityInfo.blurb}</p>
        </div>
      {/if}

      <!-- blood potency / resonance (vampire) / vitae+bond (ghoul) -->
      {#if isVampire}
        <button class="m-acc" onclick={() => sect("blood")} aria-expanded={!!openSect["blood"]}>
          Blood Potency &amp; Resonance <span class="m-acc-val">{sys.bloodPotency ?? 0}</span>
          <span class="m-caret" class:open={openSect["blood"]}>▸</span>
        </button>
        {#if openSect["blood"]}
          <div class="m-acc-body" transition:slide={{ duration: 150 }}>
            <div class="m-field">
              <span class="m-fk">Blood Potency</span>
              <DotRating value={sys.bloodPotency} max={10} size={13} color="blood" readonly={!edit} onchange={(n) => up("system.bloodPotency", n)} />
            </div>
            <p class="m-blurb">{bpInfo.blurb}</p>
            <label class="m-field">
              <span class="m-fk">Resonance</span>
              <select value={sys.resonance?.type ?? ""} disabled={!editable} onchange={(e) => up("system.resonance.type", e.currentTarget.value)}>
                <option value="">—</option>
                {#each RESONANCES as r (r)}<option value={r}>{prettify(r)}</option>{/each}
              </select>
            </label>
            <label class="m-field">
              <span class="m-fk">Intensity</span>
              <select value={sys.resonance?.intensity ?? ""} disabled={!editable} onchange={(e) => up("system.resonance.intensity", e.currentTarget.value)}>
                <option value="">—</option>
                {#each RESONANCE_INTENSITIES as r (r)}<option value={r}>{prettify(r)}</option>{/each}
              </select>
            </label>
            <div class="m-field">
              <span class="m-fk">Dyscrasia</span>
              <span class="m-dysc">
                {#if edit}
                  <input placeholder="Named effect…" value={sys.resonance?.dyscrasia ?? ""} onchange={(e) => up("system.resonance.dyscrasia", e.currentTarget.value)} />
                {:else}
                  <span>{sys.resonance?.dyscrasia || "—"}</span>
                {/if}
                <button
                  class="m-mini-toggle"
                  class:on={!!sys.resonance?.dyscrasiaActive}
                  disabled={!editable}
                  onclick={() => up("system.resonance.dyscrasiaActive", !sys.resonance?.dyscrasiaActive)}
                >{sys.resonance?.dyscrasiaActive ? "Active" : "Off"}</button>
              </span>
            </div>
          </div>
        {/if}
      {/if}

      {#if isGhoul}
        <button class="m-acc" onclick={() => sect("bondg")} aria-expanded={!!openSect["bondg"]}>
          Vitae &amp; Blood Bond <span class="m-caret" class:open={openSect["bondg"]}>▸</span>
        </button>
        {#if openSect["bondg"]}
          <div class="m-acc-body" transition:slide={{ duration: 150 }}>
            <div class="m-field">
              <span class="m-fk">Vitae</span>
              <DotRating value={sys.vitae ?? 0} max={10} size={13} color="blood" readonly={!edit} onchange={(n) => up("system.vitae", n)} />
            </div>
            {#if regnant}
              <button class="m-row" onclick={() => (regnant as any)?.sheet?.render(true)}>
                <span class="m-row-name">Regnant: {(regnant as any).name}</span>
                <span class="m-pw-pool">open ›</span>
              </button>
            {/if}
            <label class="m-field">
              <span class="m-fk">Regnant</span>
              <input value={sys.bloodBond?.regnant ?? ""} disabled={!edit} placeholder="Name" onchange={(e) => up("system.bloodBond.regnant", e.currentTarget.value)} />
            </label>
            <div class="m-field">
              <span class="m-fk">Bond Rating</span>
              <DotRating value={sys.bloodBond?.rating ?? 0} max={6} size={13} color="blood" readonly={!edit} onchange={(n) => up("system.bloodBond.rating", n)} />
            </div>
            <div class="m-field">
              <span class="m-fk">Drinks this cycle</span>
              <span class="m-pips">
                {#each [0, 1, 2] as i (i)}
                  <span
                    class="m-pip"
                    class:on={i < (sys.bloodBond?.drinks ?? 0)}
                    role="button"
                    tabindex="0"
                    aria-label={`Drinks ${i + 1}`}
                    onclick={() => setDrinks(i)}
                    onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setDrinks(i))}
                  ></span>
                {/each}
              </span>
            </div>
            <p class="m-blurb">
              A ghoul must drink vitae at least once a month or begin aging; the bond fades after (7 − rating) months without drinking.
            </p>
          </div>
        {/if}
      {/if}

      <!-- advantages -->
      <button class="m-acc" onclick={() => sect("adv")} aria-expanded={!!openSect["adv"]}>
        Advantages &amp; Flaws <span class="m-acc-val">{advCount}</span>
        <span class="m-caret" class:open={openSect["adv"]}>▸</span>
      </button>
      {#if openSect["adv"]}
        <div class="m-acc-body" transition:slide={{ duration: 150 }}>
          {#if advCount === 0}<p class="m-empty">Merits, Flaws, Backgrounds &amp; Loresheets.</p>{/if}
          {#each ADV_GROUPS as grp (grp.kind)}
            {@const list = advOf(grp.kind)}
            {#if list.length}
              <div class="m-cat">{grp.label}</div>
              {#each list as a (a.id)}
                <div class="m-pw-row">
                  <button class="m-row" onclick={() => reveal(a.id)} title="Show detail">
                    <span class="m-row-name" class:flaw={grp.kind === "flaw"}>
                      {a.name}
                      {#if a.system.detail}<i class="m-spec">({a.system.detail})</i>{/if}
                    </span>
                  </button>
                  <DotRating value={a.system.value} max={a.system.maxValue || 5} size={13} readonly={!edit} onchange={(n) => upItem(a.id, "system.value", n)} />
                  {#if edit}<ItemControls onedit={() => editItem(doc, a.id)} ondelete={() => deleteItem(doc, a.id)} />{/if}
                </div>
                {#if expanded[a.id] && a.system.description}
                  <div class="m-detail" transition:slide={{ duration: 150 }}>
                    <div class="m-detail-body">{@html a.system.description}</div>
                  </div>
                {/if}
              {/each}
            {/if}
          {/each}
          {#if edit}<button class="m-add" onclick={() => createItem(doc, "advantage")}>+ Add Advantage</button>{/if}
        </div>
      {/if}

      <!-- blood bonds (vampire) -->
      {#if isVampire}
        <button class="m-acc" onclick={() => sect("bonds")} aria-expanded={!!openSect["bonds"]}>
          Blood Bonds <span class="m-acc-val">{(sys.bonds ?? []).length}</span>
          <span class="m-caret" class:open={openSect["bonds"]}>▸</span>
        </button>
        {#if openSect["bonds"]}
          <div class="m-acc-body" transition:slide={{ duration: 150 }}>
            {#if (sys.bonds ?? []).length === 0}<p class="m-empty">No bonds recorded.</p>{/if}
            {#each sys.bonds ?? [] as b, i (i)}
              {@const linked = bondActor(b.actorUuid)}
              <div class="m-pw-row">
                {#if edit}
                  <select class="m-bond-kind" value={b.kind ?? "thrall"} onchange={(e) => updateBond(i, "kind", e.currentTarget.value)}>
                    <option value="thrall">Thrall</option>
                    <option value="regnant">Regnant</option>
                  </select>
                  <input class="m-bond-name" placeholder="Name…" value={b.name} onchange={(e) => updateBond(i, "name", e.currentTarget.value)} />
                {:else if linked}
                  <button class="m-row" onclick={() => linked?.sheet?.render(true)}>
                    <span class="m-pw-pool">{b.kind === "regnant" ? "Regnant" : "Thrall"}</span>
                    <span class="m-row-name">{linked.name}</span>
                  </button>
                {:else}
                  <span class="m-row as-span">
                    <span class="m-pw-pool">{b.kind === "regnant" ? "Regnant" : "Thrall"}</span>
                    <span class="m-row-name">{b.name || "—"}</span>
                  </span>
                {/if}
                <DotRating value={b.rating} max={6} size={12} color="blood" readonly={!edit} onchange={(n) => updateBond(i, "rating", n)} />
                {#if edit}<ItemControls ondelete={() => removeBond(i)} />{/if}
              </div>
            {/each}
            {#if edit}<button class="m-add" onclick={addBond}>+ Add Bond</button>{/if}
          </div>
        {/if}

        <!-- convictions -->
        <button class="m-acc" onclick={() => sect("conv")} aria-expanded={!!openSect["conv"]}>
          Convictions <span class="m-acc-val">{(sys.convictions ?? []).length}</span>
          <span class="m-caret" class:open={openSect["conv"]}>▸</span>
        </button>
        {#if openSect["conv"]}
          <div class="m-acc-body" transition:slide={{ duration: 150 }}>
            {#if (sys.convictions ?? []).length === 0}<p class="m-empty">No convictions recorded.</p>{/if}
            {#each sys.convictions ?? [] as c, i (i)}
              <div class="m-conv">
                <input class="m-conv-in" placeholder="Conviction…" value={c.conviction} disabled={!edit} onchange={(e) => updateConviction(i, "conviction", e.currentTarget.value)} />
                <div class="m-conv-t">
                  <span class="m-fk">Touchstone</span>
                  <input placeholder="Name…" value={c.touchstone} disabled={!edit} onchange={(e) => updateConviction(i, "touchstone", e.currentTarget.value)} />
                  {#if edit}<ItemControls ondelete={() => removeConviction(i)} />{/if}
                </div>
              </div>
            {/each}
            {#if edit}<button class="m-add" onclick={addConviction}>+ Add Conviction</button>{/if}
          </div>
        {/if}
      {/if}

      <!-- experience -->
      <button class="m-acc" onclick={() => sect("xp")} aria-expanded={!!openSect["xp"]}>
        Experience <span class="m-acc-val">{sys.xp?.value ?? 0} XP</span>
        <span class="m-caret" class:open={openSect["xp"]}>▸</span>
      </button>
      {#if openSect["xp"]}
        <div class="m-acc-body" transition:slide={{ duration: 150 }}>
          <label class="m-field">
            <span class="m-fk">Unspent</span>
            <input type="number" min="0" value={sys.xp?.value ?? 0} disabled={!editable} onchange={(e) => up("system.xp.value", Number(e.currentTarget.value))} />
          </label>
          <label class="m-field">
            <span class="m-fk">Total earned</span>
            <input type="number" min="0" value={sys.xp?.total ?? 0} disabled={!editable} onchange={(e) => up("system.xp.total", Number(e.currentTarget.value))} />
          </label>
          <div class="m-field"><span class="m-fk">Tracked spent</span><b>{xpSpent}</b></div>
          {#if editable}<button class="m-add" onclick={() => openXpDialog(doc)}>Spend Experience…</button>{/if}
        </div>
      {/if}

      <!-- biography -->
      <button class="m-acc" onclick={() => sect("bio")} aria-expanded={!!openSect["bio"]}>
        Biography <span class="m-caret" class:open={openSect["bio"]}>▸</span>
      </button>
      {#if openSect["bio"]}
        <div class="m-acc-body" transition:slide={{ duration: 150 }}>
          {#if edit}
            <textarea class="m-bio-edit" rows="8" placeholder="Character biography (HTML supported)…" value={sys.biography ?? ""} onchange={(e) => up("system.biography", e.currentTarget.value)}></textarea>
          {:else if sys.biography}
            <div class="m-bio">{@html sys.biography}</div>
          {:else}
            <p class="m-empty">No biography recorded.</p>
          {/if}
        </div>
      {/if}

      <!-- effects -->
      <button class="m-acc" onclick={() => sect("fx")} aria-expanded={!!openSect["fx"]}>
        Effects <span class="m-caret" class:open={openSect["fx"]}>▸</span>
      </button>
      {#if openSect["fx"]}
        <div class="m-acc-body" transition:slide={{ duration: 150 }}>
          <EffectsPanel {doc} {snap} {editable} />
        </div>
      {/if}
    </div>
  {/if}

  <!-- ============ floating Roll button ============ -->
  {#if editable && !drawer}
    <button class="m-fab" onclick={openPoolDrawer} title="Build a dice pool">⚄ Roll</button>
  {/if}

  <!-- ============ bottom drawer ============ -->
  {#if drawer}
    <div class="m-scrim" transition:fade={{ duration: 150 }} onclick={closeDrawer} aria-hidden="true"></div>
    <div class="m-drawer" transition:fly={{ y: 360, duration: 220 }} role="dialog" aria-modal="true" aria-label={drawer === "pool" ? "Build dice pool" : "Feed"}>
      <div class="m-drawer-grip" aria-hidden="true"></div>

      {#if drawer === "pool"}
        <div class="m-drawer-h">
          {#if !pickAttr}Pick an Attribute{:else}Pick a Skill <i>· or a second Attribute</i>{/if}
          <button class="m-drawer-x" onclick={closeDrawer} aria-label="Close">✕</button>
        </div>
        <div class="m-drawer-scroll">
          {#if !pickAttr}
            {#each attrRows as [cat, keys] (cat)}
              <div class="m-cat">{prettify(cat)}</div>
              <div class="m-chipgrid">
                {#each keys as k (k)}
                  <button class="m-pick" onclick={() => (pickAttr = k)}>
                    <span class="m-pick-name">{label("Attributes", k)}</span>
                    {@render pips(attrVal(k))}
                  </button>
                {/each}
              </div>
            {/each}
          {:else}
            <button class="m-picked" onclick={() => ((pickAttr = null), (pickSkill = null), (pickAttr2 = null))}>
              ‹ {label("Attributes", pickAttr)}
              {@render pips(attrVal(pickAttr))}
            </button>
            <input class="m-search" type="search" placeholder="Filter skills…" bind:value={skillFilter} />
            {#each skillRows as [cat, keys] (cat)}
              {@const shown = filteredSkills(keys)}
              {#if shown.length}
                <div class="m-cat">{prettify(cat)}</div>
                <div class="m-chipgrid">
                  {#each shown as k (k)}
                    <button
                      class="m-pick"
                      class:sel={pickSkill === k}
                      class:zero={skillVal(k) === 0}
                      onclick={() => choosePair("skill", k)}
                    >
                      <span class="m-pick-name">{label("Skills", k)}</span>
                      {@render pips(skillVal(k))}
                    </button>
                  {/each}
                </div>
              {/if}
            {/each}
            {#if !skillFilter.trim()}
              <div class="m-cat">Second Attribute</div>
              <div class="m-chipgrid">
                {#each attrRows as [, keys] (keys[0])}
                  {#each keys as k (k)}
                    <button class="m-pick alt" class:sel={pickAttr2 === k} onclick={() => choosePair("attr", k)}>
                      <span class="m-pick-name">{label("Attributes", k)}</span>
                      {@render pips(attrVal(k))}
                    </button>
                  {/each}
                {/each}
              </div>
            {/if}
          {/if}
        </div>
        {#if pickAttr}
          <div class="m-confirm">
            <span class="m-confirm-lbl">
              {poolLabel}
              <b>{poolPreview} dice</b>
            </span>
            <button class="m-confirm-btn" onclick={confirmPool}>Roll ›</button>
          </div>
        {/if}
      {:else if drawer === "feed"}
        <div class="m-drawer-h">
          Feed <i>· Hunger {sys.hunger ?? 0}, BP {sys.bloodPotency ?? 0}</i>
          <button class="m-drawer-x" onclick={closeDrawer} aria-label="Close">✕</button>
        </div>
        <div class="m-drawer-scroll">
          {#each feedOptions as { src, result } (src.id)}
            <button
              class="m-feed-opt"
              class:blocked={!!result.blockedReason}
              disabled={!!result.blockedReason}
              title={result.blockedReason ?? src.notes ?? ""}
              onclick={() => feed(src.id)}
            >
              <span class="m-row-name">{src.label}</span>
              <span class="m-pw-pool">
                {#if result.blockedReason}—{:else}{result.before} → {result.after}{/if}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .gl-mobile-sheet {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    background: var(--gl-parch);
    color: var(--gl-ink);
    font-family: var(--gl-body);
    font-size: 16px;
    padding-bottom: 84px; /* clear the FAB */
    position: relative;
  }

  /* ---------- sticky header ---------- */
  .m-hdr {
    position: sticky;
    top: 0;
    z-index: 6;
    background: var(--gl-parch);
    border-bottom: 2px solid var(--gl-ink);
    padding: 10px 12px 0;
    box-shadow: 0 4px 10px -8px color-mix(in srgb, var(--gl-ink) 45%, transparent);
  }
  .m-hdr-top {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .m-hdr :global(.gl-portrait) {
    width: 56px;
    height: 72px;
  }
  .m-id {
    flex: 1;
    min-width: 0;
  }
  .m-eyebrow {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 9px;
    color: var(--gl-blood);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .m-name {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 22px;
    line-height: 1.05;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .m-badges {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
  }
  .m-hdr-btns {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: none;
  }
  .m-tool {
    min-width: 44px;
    min-height: 33px;
    font-size: 15px;
    background: transparent;
    border: 1px solid var(--gl-line);
    color: var(--gl-muted-2);
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  .m-tool.on {
    background: var(--gl-gold);
    color: var(--gl-ink);
    border-color: var(--gl-ink);
  }
  /* hunger diamonds — compact but ≥ 40px hit area via padding */
  .m-diamonds {
    display: flex;
    gap: 9px;
    padding: 5px 3px;
  }
  .m-dia {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    transform: rotate(45deg);
    border: 1.5px solid var(--gl-blood);
    cursor: pointer;
    flex: none;
    background: transparent;
    box-sizing: border-box;
    transition: background 0.18s ease;
  }
  .m-dia.on {
    background: var(--gl-blood-bright);
  }
  .m-hum-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 28px;
    padding: 0 8px;
    background: transparent;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    cursor: pointer;
    font: inherit;
    color: inherit;
  }
  .m-hum-k {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-muted);
  }
  .m-hum-v {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 15px;
  }
  .m-hum-st {
    font-size: 10px;
    color: var(--gl-blood-bright);
  }
  .m-tracks {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 8px 0 6px;
  }
  .m-trk {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .m-trk-h {
    font-family: var(--gl-cond);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 10px;
    width: 24px;
    flex: none;
  }
  .m-trk :global(.track) {
    --gl-box: 20px;
    gap: 4px;
  }
  .m-impair {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    font-weight: 600;
    color: var(--gl-parch);
    background: var(--gl-blood);
    padding: 3px 7px;
    margin-bottom: 4px;
  }
  /* segmented control */
  .m-tabs {
    display: flex;
    margin: 0 -12px;
    border-top: 1px solid var(--gl-line);
  }
  .m-tab {
    flex: 1;
    min-height: 44px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-size: 11px;
    color: var(--gl-muted-2);
    cursor: pointer;
  }
  .m-tab.on {
    color: var(--gl-blood);
    border-bottom-color: var(--gl-blood);
    font-weight: 600;
  }

  /* ---------- body ---------- */
  .m-body {
    padding: 12px 14px 8px;
  }
  .m-sect-h {
    font-family: var(--gl-cond);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 12px;
    color: var(--gl-blood);
    border-bottom: 1px solid var(--gl-ink);
    padding-bottom: 4px;
    margin: 14px 0 6px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .m-body > .m-sect-h:first-child {
    margin-top: 0;
  }
  .m-hint {
    font-size: 9px;
    letter-spacing: 1px;
    color: var(--gl-muted);
    text-transform: none;
  }
  .m-cat {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 10px;
    color: var(--gl-muted);
    margin: 8px 0 3px;
  }
  .m-empty {
    font-size: 12px;
    color: var(--gl-muted);
    font-style: italic;
    margin: 4px 0 8px;
  }
  .m-blurb {
    font-size: 12px;
    font-style: italic;
    color: var(--gl-muted-2);
    margin: 6px 0;
    line-height: 1.4;
  }

  /* quick chips + checks */
  .m-chips {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 2px 0 8px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .m-chips::-webkit-scrollbar {
    display: none;
  }
  .m-chip {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    background: var(--gl-parch-raise);
    border: 1px solid var(--gl-line);
    border-radius: 22px;
    font-family: var(--gl-cond);
    letter-spacing: 0.5px;
    font-size: 13px;
    color: var(--gl-ink);
    cursor: pointer;
    white-space: nowrap;
  }
  .m-chip b {
    color: var(--gl-blood);
    font-size: 15px;
  }
  .m-chip:active {
    background: color-mix(in srgb, var(--gl-blood) 10%, var(--gl-parch-raise));
  }
  .m-checks {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }
  .m-check {
    flex: 1;
    min-height: 44px;
    min-width: 70px;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 12px;
    color: var(--gl-blood);
    background: transparent;
    border: 1px solid var(--gl-line);
    border-radius: 4px;
    cursor: pointer;
  }
  .m-check:active {
    background: color-mix(in srgb, var(--gl-blood) 10%, transparent);
  }
  .m-check.sm {
    flex: none;
    min-height: 33px;
    padding: 0 10px;
    font-size: 10px;
  }

  /* rows */
  .m-row {
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 44px;
    padding: 0 4px;
    background: transparent;
    border: none;
    border-bottom: 1px dotted var(--gl-line-soft);
    cursor: pointer;
    text-align: left;
    color: var(--gl-ink);
    font: inherit;
  }
  .m-row.as-span {
    cursor: default;
  }
  .m-row:active {
    background: color-mix(in srgb, var(--gl-blood) 8%, transparent);
  }
  .m-row:disabled {
    cursor: default;
    opacity: 0.7;
  }
  .m-row-name {
    flex: 1;
    min-width: 0;
    font-family: var(--gl-semi);
    font-weight: 500;
    font-size: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .m-row-name.flaw {
    color: var(--gl-blood);
  }
  .m-spec {
    font-size: 11px;
    color: var(--gl-muted);
    font-style: italic;
    font-weight: 400;
  }
  .m-trait-row,
  .m-pw-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .m-pw-pool {
    flex: none;
    font-family: var(--gl-cond);
    font-size: 11px;
    letter-spacing: 0.5px;
    color: var(--gl-muted-2);
  }
  .m-pw-lvl {
    font-family: var(--gl-cond);
    font-weight: 600;
    color: var(--gl-blood);
    width: 14px;
    text-align: center;
    flex: none;
  }
  .m-power {
    padding-left: 12px;
  }
  .m-roll {
    background: transparent;
    border: 1px solid var(--gl-line);
    border-radius: 4px;
    color: var(--gl-blood);
    cursor: pointer;
    font-size: 17px;
    min-width: 44px;
    min-height: 44px;
    flex: none;
  }
  .m-info {
    background: transparent;
    border: none;
    color: var(--gl-muted);
    cursor: pointer;
    font-size: 13px;
    min-width: 36px;
    min-height: 44px;
    flex: none;
  }
  .m-caret {
    font-size: 11px;
    color: var(--gl-muted);
    transition: transform 0.12s;
    transform: rotate(0deg);
    display: inline-block;
  }
  .m-caret.open {
    transform: rotate(90deg);
  }

  /* disciplines */
  .m-disc {
    margin-bottom: 4px;
  }
  .m-disc-h {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
  }
  .m-disc-name {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    justify-content: flex-start;
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 17px;
    color: var(--gl-ink);
  }

  /* details */
  .m-detail {
    font-size: 12px;
    line-height: 1.5;
    color: var(--gl-muted-2);
    background: var(--gl-parch-raise);
    border-left: 2px solid var(--gl-blood);
    padding: 8px 12px;
    margin: 2px 0 8px;
  }
  .m-detail-body :global(p) {
    margin: 0 0 6px;
  }
  .m-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-family: var(--gl-cond);
    font-size: 11px;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .m-facts b {
    color: var(--gl-blood);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    margin-right: 3px;
  }

  /* add buttons */
  .m-add {
    min-height: 44px;
    padding: 0 14px;
    margin-top: 6px;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-size: 11px;
    color: var(--gl-blood);
    background: transparent;
    border: 1px dashed var(--gl-line);
    border-radius: 4px;
    cursor: pointer;
  }
  .m-add.sub {
    margin-left: 26px;
    min-height: 38px;
  }
  .m-add-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .m-add-row .m-add {
    flex: 1;
  }

  /* skills header toggle */
  .m-mini-toggle {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 10px;
    min-height: 30px;
    padding: 0 10px;
    color: var(--gl-muted-2);
    background: transparent;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    cursor: pointer;
  }
  .m-mini-toggle.on {
    color: var(--gl-blood);
    border-color: var(--gl-blood);
  }
  .m-mini-toggle.wide {
    display: block;
    width: 100%;
    min-height: 44px;
    margin-top: 8px;
  }

  /* accordions (Character tab) */
  .m-acc {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 2px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--gl-line);
    cursor: pointer;
    text-align: left;
    font-family: var(--gl-cond);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 2.5px;
    font-size: 12px;
    color: var(--gl-blood);
    justify-content: flex-start;
  }
  .m-acc .m-caret {
    margin-left: auto;
  }
  .m-acc-val {
    font-family: var(--gl-serif);
    font-weight: 700;
    letter-spacing: 0;
    font-size: 14px;
    color: var(--gl-ink);
  }
  .m-acc-body {
    padding: 8px 2px 12px;
    border-bottom: 1px solid var(--gl-line-soft);
  }

  /* fields */
  .m-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
    border-bottom: 1px dotted var(--gl-line-soft);
    font-size: 15px;
  }
  .m-fk {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 10px;
    color: var(--gl-muted);
    flex: none;
  }
  .m-field input,
  .m-field select,
  .m-bond-name,
  .m-conv-in,
  .m-conv-t input {
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 15px;
    color: var(--gl-ink);
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    text-align: right;
    flex: 1;
    min-width: 0;
    min-height: 36px;
  }
  .m-field input:not(:disabled),
  .m-field select:not(:disabled) {
    border-bottom-color: var(--gl-line);
  }
  .m-field input:disabled,
  .m-field select:disabled {
    opacity: 1;
    color: var(--gl-ink);
  }
  .m-dysc {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    justify-content: flex-end;
  }
  .m-dysc input {
    flex: 1;
    min-width: 0;
    text-align: right;
    border-bottom: 1px solid var(--gl-line);
    background: transparent;
    color: var(--gl-ink);
    font: inherit;
    min-height: 36px;
  }
  .m-bane {
    font-size: 12px;
    color: var(--gl-muted-2);
    line-height: 1.45;
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .m-bane b {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-blood);
    margin-right: 4px;
  }

  /* humanity boxes */
  .m-humanity {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 0;
  }
  .m-ubox {
    width: 26px;
    height: 26px;
    border: 1.5px solid var(--gl-ink);
    cursor: pointer;
    display: inline-block;
    flex: none;
    position: relative;
    background: transparent;
    box-sizing: border-box;
    transition: background 0.18s ease;
  }
  .m-ubox.on {
    background: var(--gl-ink);
  }
  .m-ubox::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 32px;
    transform: translate(-50%, -50%) rotate(45deg) scaleY(0);
    background: var(--gl-blood-bright);
    transition: transform 0.18s ease-out;
  }
  .m-ubox.stain::after {
    transform: translate(-50%, -50%) rotate(45deg) scaleY(1);
  }
  .m-stainctl {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 10px;
    color: var(--gl-muted);
    margin-top: 6px;
  }
  .m-mini-btn {
    cursor: pointer;
    width: 36px;
    height: 36px;
    border: 1px solid var(--gl-ink);
    background: transparent;
    color: var(--gl-ink);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 1;
    padding: 0;
  }

  /* ghoul drinks pips */
  .m-pips {
    display: inline-flex;
    gap: 10px;
  }
  .m-pip {
    width: 22px;
    height: 22px;
    border: 1.5px solid var(--gl-blood);
    border-radius: 50%;
    cursor: pointer;
    box-sizing: border-box;
    background: transparent;
    transition: background 0.14s ease;
  }
  .m-pip.on {
    background: var(--gl-blood);
  }

  /* bonds / convictions */
  .m-bond-kind {
    font-family: var(--gl-cond);
    font-size: 12px;
    background: transparent;
    border: 1px solid var(--gl-line);
    color: var(--gl-ink);
    min-height: 36px;
    flex: none;
  }
  .m-bond-name {
    text-align: left;
    border-bottom: 1px solid var(--gl-line);
  }
  .m-conv {
    padding: 6px 0;
    border-bottom: 1px dotted var(--gl-line-soft);
  }
  .m-conv-in {
    display: block;
    width: 100%;
    text-align: left;
    border-bottom: 1px solid var(--gl-line);
  }
  .m-conv-in:disabled {
    border-bottom-color: transparent;
    opacity: 1;
  }
  .m-conv-t {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
  }
  .m-conv-t input {
    text-align: left;
    border-bottom: 1px solid var(--gl-line);
  }
  .m-conv-t input:disabled {
    border-bottom-color: transparent;
    opacity: 1;
  }

  /* equipment */
  .m-eq-check {
    min-width: 40px;
    min-height: 44px;
    flex: none;
    background: transparent;
    border: 1px solid var(--gl-line);
    border-radius: 4px;
    color: transparent;
    cursor: pointer;
    font-size: 15px;
  }
  .m-eq-check.on {
    color: var(--gl-blood);
    border-color: var(--gl-blood);
  }
  .m-eq-qty {
    font-family: var(--gl-cond);
    font-size: 12px;
    color: var(--gl-muted-2);
    min-width: 40px;
    text-align: center;
    flex: none;
  }

  /* biography */
  .m-bio {
    font-size: 14px;
    line-height: 1.55;
  }
  .m-bio :global(p) {
    margin: 0 0 8px;
  }
  .m-bio-edit {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--gl-line);
    background: var(--gl-parch-raise);
    color: var(--gl-ink);
    font-family: inherit;
    font-size: 14px;
    padding: 8px;
    resize: vertical;
  }

  /* ---------- FAB ---------- */
  /* Viewport-fixed (the suite forces `transform: none` on the mobile sheet
     window, so fixed positioning is viewport-relative). Pinned above the
     suite's bottom tab bar via --m-dock. */
  .m-fab {
    position: fixed;
    right: 16px;
    bottom: calc(12px + var(--m-dock, 0px) + env(safe-area-inset-bottom, 0px));
    z-index: 60;
    min-height: 52px;
    padding: 0 34px;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 14px;
    font-weight: 600;
    color: var(--gl-parch);
    background: var(--gl-blood);
    border: 1px solid var(--gl-blood);
    border-radius: 26px;
    cursor: pointer;
    box-shadow: 0 6px 18px -6px color-mix(in srgb, var(--gl-ink) 60%, transparent);
  }
  .m-fab:active {
    background: var(--gl-blood-bright);
  }

  /* ---------- drawer ---------- */
  .m-scrim {
    position: fixed;
    inset: 0;
    z-index: 62;
    background: color-mix(in srgb, var(--gl-ink) 45%, transparent);
  }
  .m-drawer {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(var(--m-dock, 0px) + env(safe-area-inset-bottom, 0px));
    width: 100%;
    max-width: 480px;
    max-height: 72vh;
    z-index: 63;
    display: flex;
    flex-direction: column;
    background: var(--gl-parch);
    border-top: 2px solid var(--gl-ink);
    border-radius: 14px 14px 0 0;
    box-shadow: 0 -8px 30px -8px color-mix(in srgb, var(--gl-ink) 70%, transparent);
  }
  .m-drawer-grip {
    width: 44px;
    height: 4px;
    border-radius: 2px;
    background: var(--gl-line);
    margin: 8px auto 2px;
    flex: none;
  }
  .m-drawer-h {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--gl-cond);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 12px;
    color: var(--gl-blood);
    padding: 6px 16px 8px;
    border-bottom: 1px solid var(--gl-line);
    flex: none;
  }
  .m-drawer-h i {
    text-transform: none;
    letter-spacing: 0.5px;
    font-size: 11px;
    color: var(--gl-muted);
  }
  .m-drawer-x {
    margin-left: auto;
    min-width: 44px;
    min-height: 40px;
    background: transparent;
    border: none;
    color: var(--gl-muted-2);
    font-size: 15px;
    cursor: pointer;
  }
  .m-drawer-scroll {
    overflow-y: auto;
    padding: 6px 16px 12px;
    -webkit-overflow-scrolling: touch;
  }
  .m-chipgrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  /* Picker chip: trait name over a centered row of V5 dot pips. */
  .m-pick {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-height: 54px;
    padding: 6px 6px 8px;
    background: var(--gl-parch-raise);
    border: 1px solid var(--gl-line);
    border-radius: 6px;
    font-family: var(--gl-semi);
    font-weight: 500;
    font-size: 13px;
    color: var(--gl-ink);
    cursor: pointer;
    text-align: center;
    overflow: hidden;
  }
  .m-pick-name {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.15;
  }
  .m-pick-pips {
    display: inline-flex;
    gap: 4px;
    flex: none;
  }
  .m-pick-pip {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid var(--gl-ink);
    background: transparent;
    box-sizing: border-box;
    flex: none;
  }
  .m-pick-pip.on {
    background: var(--gl-ink);
  }
  .m-pick.alt {
    border-style: dashed;
  }
  /* Untrained (0-dot) skills: dimmed but still tappable — untrained rolls are
     legal in V5. */
  .m-pick.zero {
    opacity: 0.45;
  }
  .m-pick.zero .m-pick-name {
    color: var(--gl-muted-2);
  }
  .m-pick.sel {
    background: var(--gl-blood);
    border-color: var(--gl-blood);
    color: var(--gl-parch);
    opacity: 1;
  }
  .m-pick.sel .m-pick-name {
    color: var(--gl-parch);
  }
  .m-pick.sel .m-pick-pip {
    border-color: var(--gl-parch);
  }
  .m-pick.sel .m-pick-pip.on {
    background: var(--gl-parch);
  }
  .m-pick:active {
    border-color: var(--gl-blood);
  }
  .m-picked {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    margin-bottom: 4px;
    background: color-mix(in srgb, var(--gl-blood) 8%, transparent);
    border: 1px solid var(--gl-blood);
    border-radius: 6px;
    font-family: var(--gl-semi);
    font-weight: 600;
    font-size: 15px;
    color: var(--gl-ink);
    cursor: pointer;
    justify-content: flex-start;
    text-align: left;
  }
  .m-picked .m-pick-pips {
    margin-left: auto;
  }
  .m-picked .m-pick-pip {
    border-color: var(--gl-blood);
  }
  .m-picked .m-pick-pip.on {
    background: var(--gl-blood);
  }
  .m-search {
    display: block;
    width: 100%;
    box-sizing: border-box;
    min-height: 40px;
    margin: 6px 0 2px;
    padding: 0 12px;
    font: inherit;
    font-size: 14px;
    color: var(--gl-ink);
    background: var(--gl-parch-raise);
    border: 1px solid var(--gl-line);
    border-radius: 6px;
  }
  .m-search:focus {
    outline: none;
    border-color: var(--gl-blood);
  }
  .m-confirm {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px; /* drawer bottom already clears dock + safe area */
    border-top: 1px solid var(--gl-ink);
    background: var(--gl-parch-raise);
    flex: none;
  }
  .m-confirm-lbl {
    flex: 1;
    min-width: 0;
    font-family: var(--gl-semi);
    font-weight: 600;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .m-confirm-lbl b {
    color: var(--gl-blood);
    font-family: var(--gl-cond);
    letter-spacing: 1px;
    font-size: 12px;
  }
  .m-confirm-btn {
    flex: none;
    min-height: 48px;
    padding: 0 26px;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 13px;
    font-weight: 600;
    color: var(--gl-parch);
    background: var(--gl-blood);
    border: 1px solid var(--gl-blood);
    border-radius: 6px;
    cursor: pointer;
  }
  .m-confirm-btn:active {
    background: var(--gl-blood-bright);
  }
  .m-feed-opt {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    padding: 0 6px;
    background: transparent;
    border: none;
    border-bottom: 1px dotted var(--gl-line-soft);
    cursor: pointer;
    text-align: left;
    color: var(--gl-ink);
    font: inherit;
  }
  .m-feed-opt.blocked {
    opacity: 0.45;
    cursor: default;
  }
  .m-feed-opt:active:not(.blocked) {
    background: color-mix(in srgb, var(--gl-blood) 8%, transparent);
  }
</style>
