<script lang="ts">
  import { slide } from "svelte/transition";
  import { pulse } from "../apps/anim.ts";
  import { CLANS, PREDATOR_TYPES, RESONANCES, RESONANCE_INTENSITIES, BLOOD_POTENCY } from "../config.ts";
  import { prettify, label } from "../components/labels.ts";
  import {
    HUMANITY_INFO,
    bloodPotencyInfo,
    RESONANCE_INFO,
    RESONANCE_INTENSITY_INFO,
    resonanceDieBonus,
  } from "../vtm/lore.ts";
  import DotRating from "../components/DotRating.svelte";
  import DamageTrack from "../components/DamageTrack.svelte";
  import AttributeGrid from "../components/AttributeGrid.svelte";
  import SkillGrid from "../components/SkillGrid.svelte";
  import ItemControls from "../components/ItemControls.svelte";
  import EffectsPanel from "../components/EffectsPanel.svelte";
  import Portrait from "../components/Portrait.svelte";
  import { createItem, editItem, deleteItem } from "../apps/actor-items.ts";
  import { openBuilder } from "../apps/BuilderApp.ts";
  import { openRollDialog, rollPower, rollDiscipline, rollWeapon } from "../apps/RollDialogApp.ts";
  import { openXpDialog } from "../apps/XpDialogApp.ts";
  import { pickImage } from "../apps/image.ts";
  import { rouseCheck, remorseCheck } from "../dice/checks.ts";
  import { openFrenzyDialog } from "../dice/frenzy.ts";
  import { clanBane, clanCompulsion } from "../vtm/clans.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    doc: any;
    snap: any;
    app: any;
  }
  let { doc, snap, app }: Props = $props();

  const sys = $derived(snap.system);
  const items = $derived(snap.items as any[]);

  const disciplines = $derived(items.filter((i) => i.type === "discipline"));
  const rituals = $derived(items.filter((i) => i.type === "ritual"));
  const ceremonies = $derived(items.filter((i) => i.type === "ceremony"));
  const weapons = $derived(items.filter((i) => i.type === "weapon"));
  const armor = $derived(items.filter((i) => i.type === "armor"));
  const gear = $derived(items.filter((i) => i.type === "gear"));
  const powersFor = (id: string) =>
    items.filter((i) => i.type === "power" && i.system.parentDiscipline === id);

  // Advantages grouped by kind so backgrounds read differently from merits/flaws.
  const ADV_GROUPS = [
    { kind: "background", label: "Backgrounds" },
    { kind: "merit", label: "Merits" },
    { kind: "flaw", label: "Flaws" },
    { kind: "loresheet", label: "Loresheets" },
  ] as const;
  const advOf = (kind: string) =>
    items.filter((i) => i.type === "advantage" && (i.system.kind ?? "merit") === kind);

  // Clan bane / compulsion, scaled by Bane Severity from Blood Potency.
  const baneSeverity = $derived(BLOOD_POTENCY[Math.max(0, Math.min(10, sys.bloodPotency ?? 0))]?.bane ?? 0);
  const bane = $derived(sys.clan ? clanBane(sys.clan) : "");
  const compulsion = $derived(sys.clan ? clanCompulsion(sys.clan) : "");

  // What the current state levels entail, for the expandable readouts.
  const humanityInfo = $derived(HUMANITY_INFO[Math.max(0, Math.min(10, sys.humanity?.value ?? 0))]!);
  const bpInfo = $derived(bloodPotencyInfo(sys.bloodPotency ?? 0));
  const resoInfo = $derived(sys.resonance?.type ? RESONANCE_INFO[sys.resonance.type as keyof typeof RESONANCE_INFO] : null);
  const resoIntensity = $derived(
    sys.resonance?.intensity ? RESONANCE_INTENSITY_INFO[sys.resonance.intensity] : null,
  );
  const resoBonus = $derived(resonanceDieBonus(sys.resonance));

  // --- local UI state -------------------------------------------------------
  let collapsed: Record<string, boolean> = $state({});
  let expanded: Record<string, boolean> = $state({});
  let editMode = $state(false);
  let dragOver = $state(false);
  let showHumanityInfo = $state(false);
  let showBpInfo = $state(false);

  const toggle = (key: string) => (collapsed[key] = !collapsed[key]);
  const reveal = (key: string) => (expanded[key] = !expanded[key]);

  // --- document edits -------------------------------------------------------
  function up(path: string, value: unknown) {
    doc.update({ [path]: value });
  }
  function upItem(id: string, path: string, value: unknown) {
    doc.items.get(id)?.update({ [path]: value });
  }
  function bumpStain(delta: number) {
    up("system.humanity.stains", Math.max(0, Math.min(10, (sys.humanity.stains ?? 0) + delta)));
  }
  function setHunger(i: number) {
    up("system.hunger", sys.hunger === i + 1 ? i : i + 1);
  }
  function setHumanity(i: number) {
    up("system.humanity.value", sys.humanity.value === i + 1 ? i : i + 1);
  }

  // --- convictions ----------------------------------------------------------
  function addConviction() {
    up("system.convictions", [...(sys.convictions ?? []), { conviction: "", touchstone: "" }]);
  }
  function updateConviction(i: number, field: "conviction" | "touchstone", value: string) {
    const list = (sys.convictions ?? []).map((c: any, idx: number) =>
      idx === i ? { ...c, [field]: value } : c,
    );
    up("system.convictions", list);
  }
  function removeConviction(i: number) {
    up("system.convictions", (sys.convictions ?? []).filter((_: any, idx: number) => idx !== i));
  }

  // --- drag & drop ----------------------------------------------------------
  function onDrop(event: DragEvent) {
    dragOver = false;
    app.glHandleDrop?.(event);
  }

  // Marquee copy for the edit-mode frame; two identical spans scroll -50% for a
  // seamless loop.
  const EDIT_TICKER = "EDIT MODE · ".repeat(24);

  // --- rolls ----------------------------------------------------------------
  const rollAttr = (k: string) => openRollDialog(doc, { attribute: k });
  const rollSkill = (k: string) => openRollDialog(doc, { skill: k });
  const openPool = () => openRollDialog(doc, {});
</script>

<div
  class="gl-vampire"
  class:dragover={dragOver}
  class:play={!editMode}
  class:editing={editMode}
  role="region"
  aria-label="Vampire character sheet"
  ondragover={(e) => (e.preventDefault(), (dragOver = true))}
  ondragleave={() => (dragOver = false)}
  ondrop={onDrop}
>
  {#if editMode}
    <div class="edit-marquee top" aria-hidden="true">
      <div class="edit-marquee-track"><span>{EDIT_TICKER}</span><span>{EDIT_TICKER}</span></div>
    </div>
  {/if}
  <!-- header -->
  <header class="hdr">
    <div class="spine"></div>
    <Portrait img={snap.img} name={snap.name} editable={editMode} onedit={() => pickImage(doc)} />
    <div class="hdr-main">
      <div class="hdr-top">
        <div class="idblock">
          <div class="eyebrow">Kindred · Player Character</div>
          <input
            class="name"
            value={snap.name}
            disabled={!editMode}
            onchange={(e) => doc.update({ name: e.currentTarget.value })}
          />
        </div>
        <div class="hdr-tools">
          <button class="mode-toggle" class:on={editMode} onclick={() => (editMode = !editMode)} title="Toggle play / edit">
            {editMode ? "🔓 Edit" : "🔒 Play"}
          </button>
          <button class="tool-btn" onclick={() => openBuilder(doc)} title="Step-by-step character builder">Builder</button>
          <button class="tool-btn" onclick={() => openXpDialog(doc)} title="Spend experience">Spend XP</button>
          <button class="roll-cta" onclick={openPool} title="Build a dice pool">Roll Pool</button>
        </div>
      </div>
      <div class="facts">
        <label class="fact">
          <span class="fk">Clan</span>
          <select value={sys.clan} disabled={!editMode} onchange={(e) => up("system.clan", e.currentTarget.value)}>
            <option value="">—</option>
            {#each CLANS as c (c)}<option value={c}>{prettify(c)}</option>{/each}
          </select>
        </label>
        <label class="fact">
          <span class="fk">Generation</span>
          <input class="fv-in" type="number" min="3" max="16" value={sys.generation} disabled={!editMode} onchange={(e) => up("system.generation", Number(e.currentTarget.value))} />
        </label>
        <label class="fact">
          <span class="fk">Predator</span>
          <select value={sys.predator} disabled={!editMode} onchange={(e) => up("system.predator", e.currentTarget.value)}>
            <option value="">—</option>
            {#each PREDATOR_TYPES as p (p)}<option value={p}>{prettify(p)}</option>{/each}
          </select>
        </label>
      </div>
      <div class="hdr-sub">
        {#each [["sire", "Sire"], ["details.ambition", "Ambition"], ["details.desire", "Desire"]] as const as [path, lbl] (path)}
          <label class="sub">
            <span class="mini-lbl">{lbl}</span>
            <input value={path.split(".").reduce((o: any, k) => o?.[k], sys)} disabled={!editMode} onchange={(e) => up(`system.${path}`, e.currentTarget.value)} />
          </label>
        {/each}
      </div>
    </div>
  </header>

  {#if sys.clan}
    <div class="banestrip">
      <span class="bs-item"><span class="bs-k">Bane · Severity {baneSeverity}</span> {bane}</span>
      <span class="bs-item"><span class="bs-k">Compulsion</span> {compulsion}</span>
    </div>
  {/if}

  <!-- body -->
  <div class="body">
    <section class="left">
      <div class="sect-h">Attributes</div>
      <AttributeGrid attributes={sys.attributes} readonly={!editMode} onrate={(k, n) => up(`system.attributes.${k}.value`, n)} onroll={rollAttr} />

      <div class="sect-h">Skills</div>
      <SkillGrid
        skills={sys.skills}
        readonly={!editMode}
        onrate={(k, n) => up(`system.skills.${k}.value`, n)}
        onspec={(k, list) => up(`system.skills.${k}.specialties`, list)}
        onroll={rollSkill}
      />
    </section>

    <aside class="rail">
      <div class="trk">
        <div class="trk-h"><span class="l">Health</span><span class="r">/ superficial · ✕ aggravated</span></div>
        <DamageTrack superficial={sys.health.superficial} aggravated={sys.health.aggravated} max={sys.health.max}
          onchange={(v) => doc.update({ "system.health.superficial": v.superficial, "system.health.aggravated": v.aggravated })} />
      </div>

      <div class="trk">
        <div class="trk-h">
          <span class="l">Willpower</span>
          <button class="chk-btn" onclick={() => openFrenzyDialog(doc)} title="Resist Frenzy">Frenzy</button>
        </div>
        <DamageTrack superficial={sys.willpower.superficial} aggravated={sys.willpower.aggravated} max={sys.willpower.max}
          onchange={(v) => doc.update({ "system.willpower.superficial": v.superficial, "system.willpower.aggravated": v.aggravated })} />
      </div>

      <div class="rail-div"></div>

      <div class="trk">
        <div class="trk-h">
          <span class="l blood">Hunger</span>
          <button class="chk-btn" onclick={() => rouseCheck(doc)} title="Rouse the Blood">Rouse</button>
        </div>
        <div class="diamonds">
          {#each Array.from({ length: 5 }, (_, i) => i) as i (i)}
            <span class="dia" class:on={i < sys.hunger} role="button" tabindex="0" aria-label={`Hunger ${i + 1}`}
              onclick={() => setHunger(i)}
              onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setHunger(i))}></span>
          {/each}
        </div>
      </div>

      <div class="trk">
        <div class="trk-h">
          <span class="l">Humanity</span>
          <span class="stainctl">
            Stains
            <button class="mini-btn" onclick={() => bumpStain(-1)} aria-label="Decrease stains">–</button>
            <button class="mini-btn" onclick={() => bumpStain(1)} aria-label="Increase stains">+</button>
            <button class="chk-btn" onclick={() => remorseCheck(doc)} title="Remorse check">Remorse</button>
          </span>
        </div>
        <div class="humanity">
          {#each Array.from({ length: 10 }, (_, i) => i) as i (i)}
            <span class="ubox" class:on={i < sys.humanity.value} class:stain={i >= 10 - (sys.humanity.stains ?? 0)}
              role="button" tabindex="0" aria-label={`Humanity ${i + 1}`}
              onclick={() => setHumanity(i)}
              onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setHumanity(i))}></span>
          {/each}
        </div>
        <button class="lvl-readout" onclick={() => (showHumanityInfo = !showHumanityInfo)} aria-expanded={showHumanityInfo}>
          <span class="lvl-num" use:pulse={sys.humanity.value}>{sys.humanity.value}</span>
          <span class="lvl-blurb">{humanityInfo.blurb}</span>
          <span class="lvl-caret" class:open={showHumanityInfo}>▸</span>
        </button>
        {#if showHumanityInfo}
          <ul class="lvl-effects" transition:slide={{ duration: 150 }}>
            {#each humanityInfo.effects as e (e)}<li>{e}</li>{/each}
          </ul>
        {/if}
      </div>

      <div class="rail-div"></div>

      <div class="trk">
        <div class="trk-h">
          <span class="l">Blood Potency</span>
          <DotRating value={sys.bloodPotency} max={10} size={11} color="blood" readonly={!editMode} onchange={(n) => up("system.bloodPotency", n)} />
        </div>
        <button class="lvl-readout" onclick={() => (showBpInfo = !showBpInfo)} aria-expanded={showBpInfo}>
          <span class="lvl-num" use:pulse={sys.bloodPotency ?? 0}>{sys.bloodPotency ?? 0}</span>
          <span class="lvl-blurb">{bpInfo.blurb}</span>
          <span class="lvl-caret" class:open={showBpInfo}>▸</span>
        </button>
        {#if showBpInfo}
          <ul class="lvl-effects" transition:slide={{ duration: 150 }}>
            {#each bpInfo.effects as e (e)}<li>{e}</li>{/each}
          </ul>
        {/if}

        <div class="reso">
          <span class="mini-lbl">Resonance</span>
          <select class="reso-sel" value={sys.resonance?.type ?? ""} onchange={(e) => up("system.resonance.type", e.currentTarget.value)}>
            <option value="">—</option>
            {#each RESONANCES as r (r)}<option value={r}>{prettify(r)}</option>{/each}
          </select>
        </div>
        <div class="reso">
          <span class="mini-lbl">Intensity</span>
          <select class="reso-sel" value={sys.resonance?.intensity ?? ""} onchange={(e) => up("system.resonance.intensity", e.currentTarget.value)}>
            <option value="">—</option>
            {#each RESONANCE_INTENSITIES as r (r)}<option value={r}>{prettify(r)}</option>{/each}
          </select>
        </div>
        {#if resoInfo}
          <div class="reso-info">
            <div class="reso-discs">
              {#if resoBonus.dice > 0}
                <span class="reso-bonus">+{resoBonus.dice}</span>
              {/if}
              <span class="reso-disc-names">{resoInfo.disciplines.map((d) => label("Disciplines", d)).join(" · ")}</span>
            </div>
            {#if resoIntensity}<p class="reso-note">{resoIntensity.blurb}</p>{/if}
            <p class="reso-emote">{resoInfo.emotions}</p>
          </div>
        {/if}
      </div>
    </aside>
  </div>

  <!-- disciplines + advantages -->
  <div class="panels">
    <section class="panel brd">
      <div class="sect-h with-add">
        Disciplines
        {#if editMode}<button class="add-btn" onclick={() => createItem(doc, "discipline")} title="Add discipline">+ Add</button>{/if}
      </div>
      {#if disciplines.length === 0}
        <p class="empty">Drag Discipline items here{#if editMode}, or click <b>+ Add</b>{/if}.</p>
      {/if}
      {#each disciplines as d (d.id)}
        {@const powers = powersFor(d.id)}
        <div class="disc gl-hoverable" data-item-id={d.id}>
          <div class="disc-h">
            <button class="caret" class:open={!collapsed[d.id]} onclick={() => toggle(d.id)} aria-label="Toggle powers">▸</button>
            <button class="disc-name reveal" onclick={() => reveal(d.id)} title="Show detail">{d.name}</button>
            <button class="mini-roll" onclick={() => rollDiscipline(doc, d)} title="Roll {d.name}" aria-label="Roll">⚄</button>
            <DotRating value={d.system.value} size={13} readonly={!editMode} onchange={(n) => upItem(d.id, "system.value", n)} />
            {#if editMode}<ItemControls onedit={() => editItem(doc, d.id)} ondelete={() => deleteItem(doc, d.id)} />{/if}
          </div>
          {#if expanded[d.id] && d.system.description}
            <div class="detail" transition:slide={{ duration: 150 }}>{@html d.system.description}</div>
          {/if}
          {#if !collapsed[d.id]}
            {#each powers as p (p.id)}
              <div class="pw gl-row" data-item-id={p.id}>
                <span class="pw-lvl">{p.system.level}</span>
                <button class="pw-name reveal" onclick={() => reveal(p.id)} title="Show detail">{p.name}</button>
                <button class="mini-roll" onclick={() => rollPower(doc, p)} title="Roll {p.name}" aria-label="Roll">⚄</button>
                {#if editMode}<ItemControls onedit={() => editItem(doc, p.id)} ondelete={() => deleteItem(doc, p.id)} />{/if}
              </div>
              {#if expanded[p.id]}
                <div class="detail pw-detail" transition:slide={{ duration: 150 }}>
                  <div class="detail-facts">
                    {#if p.system.cost}<span><b>Cost</b> {p.system.cost}</span>{/if}
                    {#if p.system.pool}<span><b>Pool</b> {p.system.pool}</span>{/if}
                    {#if p.system.opposingPool}<span><b>vs</b> {p.system.opposingPool}</span>{/if}
                    {#if p.system.amalgam?.discipline}<span><b>Amalgam</b> {prettify(p.system.amalgam.discipline)} {p.system.amalgam.level}</span>{/if}
                  </div>
                  {#if p.system.description}<div class="detail-body">{@html p.system.description}</div>{/if}
                </div>
              {/if}
            {/each}
            {#if editMode}
              <button class="sub-add" onclick={() => createItem(doc, "power", { "system.parentDiscipline": d.id, "system.discipline": d.system.discipline })}>+ Power</button>
            {/if}
          {/if}
        </div>
      {/each}
    </section>

    <section class="panel">
      <div class="sect-h with-add">
        Advantages &amp; Flaws
        {#if editMode}<button class="add-btn" onclick={() => createItem(doc, "advantage")} title="Add advantage">+ Add</button>{/if}
      </div>
      {#if items.filter((i) => i.type === "advantage").length === 0}
        <p class="empty">Merits, Flaws, Backgrounds &amp; Loresheets.</p>
      {/if}
      {#each ADV_GROUPS as grp (grp.kind)}
        {@const list = advOf(grp.kind)}
        {#if list.length}
          <div class="adv-group">
            <div class="adv-group-h" data-kind={grp.kind}>{grp.label}</div>
            {#each list as a (a.id)}
              <div class="adv gl-row" data-item-id={a.id}>
                <button class="adv-lbl reveal" class:flaw={grp.kind === "flaw"} onclick={() => reveal(a.id)} title="Show detail">
                  <span class="adv-tag" data-kind={grp.kind}>{grp.label.slice(0, 1)}</span>
                  <b>{a.name}</b>
                  {#if a.system.detail}<span class="adv-detail">({a.system.detail})</span>{/if}
                </button>
                <DotRating value={a.system.value} max={a.system.maxValue || 5} size={13} readonly={!editMode} onchange={(n) => upItem(a.id, "system.value", n)} />
                {#if editMode}<ItemControls onedit={() => editItem(doc, a.id)} ondelete={() => deleteItem(doc, a.id)} />{/if}
              </div>
              {#if expanded[a.id] && a.system.description}
                <div class="detail" transition:slide={{ duration: 150 }}>{@html a.system.description}</div>
              {/if}
            {/each}
          </div>
        {/if}
      {/each}
    </section>
  </div>

  <!-- rituals / ceremonies + equipment -->
  <div class="panels">
    <section class="panel brd">
      <div class="sect-h with-add">
        Rituals &amp; Ceremonies
        {#if editMode}
          <span class="add-group">
            <button class="add-btn" onclick={() => createItem(doc, "ritual")} title="Add Blood Sorcery ritual">+ Ritual</button>
            <button class="add-btn" onclick={() => createItem(doc, "ceremony")} title="Add Oblivion ceremony">+ Ceremony</button>
          </span>
        {/if}
      </div>
      {#if rituals.length === 0 && ceremonies.length === 0}
        <p class="empty">Blood Sorcery rituals &amp; Oblivion ceremonies.</p>
      {/if}
      {#each [...rituals, ...ceremonies] as r (r.id)}
        <div class="adv gl-row" data-item-id={r.id}>
          <button class="adv-lbl reveal" onclick={() => reveal(r.id)}>
            <b>{r.name}</b><i>· {prettify(r.type)} {r.system.level}</i>
          </button>
          {#if editMode}<ItemControls onedit={() => editItem(doc, r.id)} ondelete={() => deleteItem(doc, r.id)} />{/if}
        </div>
        {#if expanded[r.id] && r.system.description}
          <div class="detail" transition:slide={{ duration: 150 }}>{@html r.system.description}</div>
        {/if}
      {/each}
    </section>

    <section class="panel">
      <div class="sect-h with-add">
        Equipment
        {#if editMode}
          <span class="add-group">
            <button class="add-btn" onclick={() => createItem(doc, "weapon")} title="Add weapon">+ Weapon</button>
            <button class="add-btn" onclick={() => createItem(doc, "armor")} title="Add armor">+ Armor</button>
            <button class="add-btn" onclick={() => createItem(doc, "gear")} title="Add gear">+ Gear</button>
          </span>
        {/if}
      </div>
      {#if weapons.length === 0 && armor.length === 0 && gear.length === 0}
        <p class="empty">Weapons, armor &amp; carried gear.</p>
      {/if}
      {#each weapons as w (w.id)}
        <div class="eq gl-row" data-item-id={w.id}>
          <button class="eq-check" class:on={w.system.equipped} aria-label="Toggle equipped" title="Equipped" onclick={() => upItem(w.id, "system.equipped", !w.system.equipped)}>✓</button>
          <button class="eq-name reveal" onclick={() => reveal(w.id)} title="Show detail"><b>{w.name}</b></button>
          <span class="eq-stat">{w.system.damage} {w.system.damageType === "aggravated" ? "agg" : "sup"}</span>
          <button class="mini-roll" onclick={() => rollWeapon(doc, w)} title="Roll {w.name}" aria-label="Roll">⚄</button>
          {#if editMode}<ItemControls onedit={() => editItem(doc, w.id)} ondelete={() => deleteItem(doc, w.id)} />{/if}
        </div>
        {#if expanded[w.id]}
          <div class="detail" transition:slide={{ duration: 150 }}>
            <div class="detail-facts">
              <span><b>Damage</b> {w.system.damage} {w.system.damageType}</span>
              {#if w.system.pool}<span><b>Pool</b> {w.system.pool}</span>{/if}
              {#if w.system.range}<span><b>Range</b> {w.system.range}</span>{/if}
              {#if w.system.concealment}<span><b>Conceal</b> {w.system.concealment}</span>{/if}
              {#if (w.system.quantity ?? 1) !== 1}<span><b>Qty</b> {w.system.quantity}</span>{/if}
            </div>
            {#if w.system.description}<div class="detail-body">{@html w.system.description}</div>{/if}
          </div>
        {/if}
      {/each}
      {#each armor as a (a.id)}
        <div class="eq gl-row" data-item-id={a.id}>
          <button class="eq-check" class:on={a.system.equipped} aria-label="Toggle equipped" title="Equipped" onclick={() => upItem(a.id, "system.equipped", !a.system.equipped)}>✓</button>
          <button class="eq-name reveal" onclick={() => reveal(a.id)} title="Show detail"><b>{a.name}</b></button>
          <span class="eq-stat">rating {a.system.rating}</span>
          {#if editMode}<ItemControls onedit={() => editItem(doc, a.id)} ondelete={() => deleteItem(doc, a.id)} />{/if}
        </div>
        {#if expanded[a.id]}
          <div class="detail" transition:slide={{ duration: 150 }}>
            <div class="detail-facts">
              <span><b>Rating</b> {a.system.rating}</span>
              {#if a.system.type}<span><b>Type</b> {a.system.type}</span>{/if}
              {#if a.system.penalty}<span><b>Penalty</b> {a.system.penalty}</span>{/if}
            </div>
            {#if a.system.description}<div class="detail-body">{@html a.system.description}</div>{/if}
          </div>
        {/if}
      {/each}
      {#each gear as g (g.id)}
        <div class="eq gl-row" data-item-id={g.id}>
          <span class="eq-qty">×{g.system.quantity}</span>
          <button class="eq-name reveal" onclick={() => reveal(g.id)} title="Show detail"><b>{g.name}</b></button>
          {#if editMode}<ItemControls onedit={() => editItem(doc, g.id)} ondelete={() => deleteItem(doc, g.id)} />{/if}
        </div>
        {#if expanded[g.id]}
          <div class="detail" transition:slide={{ duration: 150 }}>
            <div class="detail-facts">
              <span><b>Qty</b> {g.system.quantity}</span>
              {#if g.system.cost}<span><b>Cost</b> {g.system.cost}</span>{/if}
            </div>
            {#if g.system.description}<div class="detail-body">{@html g.system.description}</div>{/if}
          </div>
        {/if}
      {/each}
    </section>
  </div>

  <!-- convictions + xp -->
  <div class="foot">
    <section class="panel brd">
      <div class="sect-h with-add">
        Convictions &amp; Touchstones
        {#if editMode}<button class="add-btn" onclick={addConviction} title="Add conviction">+ Add</button>{/if}
      </div>
      {#if (sys.convictions ?? []).length === 0}
        <p class="empty">No convictions recorded.</p>
      {/if}
      {#each sys.convictions ?? [] as c, i (i)}
        <div class="conv gl-row">
          <div class="conv-body">
            <input class="conv-q-in" placeholder="Conviction…" value={c.conviction} disabled={!editMode} onchange={(e) => updateConviction(i, "conviction", e.currentTarget.value)} />
            <label class="conv-t">
              <span class="mini-lbl">Touchstone</span>
              <input class="conv-t-in" placeholder="Name…" value={c.touchstone} disabled={!editMode} onchange={(e) => updateConviction(i, "touchstone", e.currentTarget.value)} />
            </label>
          </div>
          {#if editMode}<ItemControls ondelete={() => removeConviction(i)} />{/if}
        </div>
      {/each}
    </section>
    <section class="xp">
      <div class="sect-h ink">Experience</div>
      <label class="xp-row">
        <span class="xp-k">Unspent</span>
        <input class="xp-big" type="number" min="0" value={sys.xp?.value ?? 0} onchange={(e) => up("system.xp.value", Number(e.currentTarget.value))} />
      </label>
      <label class="xp-row2">
        <span>Total earned</span>
        <input class="xp-tot" type="number" min="0" value={sys.xp?.total ?? 0} onchange={(e) => up("system.xp.total", Number(e.currentTarget.value))} />
      </label>
      <button class="xp-spend" onclick={() => openXpDialog(doc)}>Spend Experience…</button>
    </section>
  </div>

  <div class="effects-wrap">
    <EffectsPanel {doc} {snap} />
  </div>

  {#if editMode}
    <div class="edit-marquee bottom" aria-hidden="true">
      <div class="edit-marquee-track"><span>{EDIT_TICKER}</span><span>{EDIT_TICKER}</span></div>
    </div>
  {/if}
</div>

<style>
  .effects-wrap {
    padding: 18px 30px 26px;
    border-top: 1px solid var(--gl-line);
  }
  .gl-vampire {
    width: 960px;
    max-width: 100%;
    margin: 0 auto;
    background: var(--gl-parch);
    color: var(--gl-ink);
    font-family: var(--gl-body);
    position: relative;
  }
  /* edit mode — unmistakably different from play mode */
  .gl-vampire.editing {
    box-shadow: inset 0 0 0 3px var(--gl-gold);
  }
  .gl-vampire.editing .spine {
    background: repeating-linear-gradient(
      -45deg,
      var(--gl-gold) 0 12px,
      var(--gl-ink) 12px 24px
    );
  }
  .edit-marquee {
    position: sticky;
    z-index: 15;
    overflow: hidden;
    white-space: nowrap;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 5px;
    font-size: 10px;
    font-weight: 600;
    padding: 5px 0;
    color: var(--gl-ink);
    background: var(--gl-gold);
  }
  .edit-marquee.top {
    top: 0;
    border-bottom: 1px solid var(--gl-ink);
  }
  .edit-marquee.bottom {
    bottom: 0;
    border-top: 1px solid var(--gl-ink);
  }
  .edit-marquee-track {
    display: inline-flex;
    animation: gl-edit-ticker 90s linear infinite;
    will-change: transform;
  }
  .edit-marquee.bottom .edit-marquee-track {
    animation-direction: reverse;
  }
  .edit-marquee-track span {
    flex: none;
  }
  @keyframes gl-edit-ticker {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
  .gl-vampire.editing input:not(:disabled),
  .gl-vampire.editing select:not(:disabled) {
    border-bottom-color: var(--gl-line);
    background: color-mix(in srgb, var(--gl-gold) 9%, transparent);
  }
  .gl-vampire.dragover::after {
    content: "Drop to add";
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 4px;
    font-size: 18px;
    color: var(--gl-blood);
    background: color-mix(in srgb, var(--gl-parch) 78%, transparent);
    border: 3px dashed var(--gl-blood);
    pointer-events: none;
  }
  input,
  select {
    font-family: inherit;
    color: var(--gl-ink);
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
  }
  input:hover:not(:disabled),
  select:hover:not(:disabled) {
    border-bottom-color: var(--gl-line);
  }
  input:focus,
  select:focus {
    outline: none;
    border-bottom-color: var(--gl-blood);
  }
  input:disabled,
  select:disabled {
    color: var(--gl-ink);
    opacity: 1;
    cursor: default;
  }

  /* header */
  .hdr {
    padding: 22px 30px 16px;
    border-bottom: 2px solid var(--gl-ink);
    position: relative;
    display: flex;
    gap: 20px;
    align-items: stretch;
  }
  .spine {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: var(--gl-blood);
  }
  .hdr-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .hdr-top {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }
  .idblock {
    flex: 1;
    min-width: 0;
  }
  .eyebrow {
    font-family: var(--gl-cond);
    font-weight: 300;
    text-transform: uppercase;
    letter-spacing: 5px;
    font-size: 10px;
    color: var(--gl-blood);
  }
  .name {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 40px;
    line-height: 1;
    margin-top: 2px;
    width: 100%;
  }
  .hdr-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
  }
  .mode-toggle,
  .tool-btn {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 10px;
    padding: 6px 10px;
    border: 1px solid var(--gl-line);
    background: transparent;
    color: var(--gl-muted-2);
    cursor: pointer;
  }
  .mode-toggle.on {
    color: var(--gl-ink);
    background: var(--gl-gold);
    border-color: var(--gl-ink);
    font-weight: 600;
  }
  .tool-btn:hover,
  .mode-toggle:hover {
    border-color: var(--gl-blood);
    color: var(--gl-blood);
  }
  .mode-toggle.on:hover {
    color: var(--gl-ink);
    border-color: var(--gl-ink);
    background: color-mix(in srgb, var(--gl-gold) 82%, white);
  }
  .facts {
    display: flex;
    gap: 26px;
    margin-top: 12px;
  }
  .fact {
    display: flex;
    flex-direction: column;
  }
  .fk {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 9px;
    color: var(--gl-muted);
  }
  .fact select,
  .fv-in {
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 20px;
  }
  .fv-in {
    width: 64px;
  }
  .hdr-sub {
    display: flex;
    gap: 30px;
    margin-top: 12px;
    flex-wrap: wrap;
  }
  .sub {
    font-size: 13px;
    display: inline-flex;
    align-items: baseline;
    flex: 1;
    min-width: 140px;
  }
  .sub input {
    flex: 1;
  }
  .mini-lbl {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 9px;
    color: var(--gl-muted);
    margin-right: 6px;
  }
  .roll-cta {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 11px;
    color: var(--gl-parch);
    background: var(--gl-blood);
    border: 1px solid var(--gl-blood);
    padding: 6px 14px;
    cursor: pointer;
  }
  .roll-cta:hover {
    background: var(--gl-blood-bright);
  }

  /* clan bane strip */
  .banestrip {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 26px;
    padding: 8px 30px;
    background: var(--gl-parch-raise);
    border-bottom: 1px solid var(--gl-line);
    font-size: 12px;
    color: var(--gl-muted-2);
  }
  .bs-item {
    flex: 1;
    min-width: 260px;
  }
  .bs-k {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 9px;
    color: var(--gl-blood);
    margin-right: 6px;
  }

  .chk-btn {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-blood);
    background: transparent;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    padding: 1px 7px;
    cursor: pointer;
  }
  .chk-btn:hover {
    border-color: var(--gl-blood);
    background: color-mix(in srgb, var(--gl-blood) 8%, transparent);
  }

  /* body */
  .body {
    display: grid;
    grid-template-columns: 1fr 300px;
  }
  .left {
    padding: 20px 26px;
    border-right: 1px solid var(--gl-line);
  }
  .sect-h {
    font-family: var(--gl-cond);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 4px;
    font-size: 13px;
    color: var(--gl-blood);
    border-bottom: 1px solid var(--gl-ink);
    padding-bottom: 5px;
    margin-bottom: 14px;
  }
  .sect-h.with-add {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .add-group {
    display: inline-flex;
    gap: 6px;
  }
  .add-btn {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 10px;
    color: var(--gl-blood);
    background: transparent;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    padding: 2px 8px;
    cursor: pointer;
    line-height: 1.4;
  }
  .add-btn:hover {
    border-color: var(--gl-blood);
    background: color-mix(in srgb, var(--gl-blood) 8%, transparent);
  }
  /* rail */
  .rail {
    padding: 20px 22px;
    background: var(--gl-parch-raise);
  }
  .trk {
    margin-bottom: 16px;
  }
  .trk-h {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 7px;
  }
  .trk-h .l {
    font-family: var(--gl-cond);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 12px;
  }
  .trk-h .l.blood {
    color: var(--gl-blood-bright);
  }
  .trk-h .r {
    font-family: var(--gl-cond);
    font-size: 9px;
    letter-spacing: 1px;
    color: var(--gl-muted);
  }
  .rail-div {
    height: 1px;
    background: var(--gl-line);
    margin: 0 -22px 16px;
  }
  .diamonds {
    display: flex;
    gap: 8px;
  }
  .dia {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    transform: rotate(45deg);
    border: 1.5px solid var(--gl-blood);
    cursor: pointer;
    display: inline-block;
    flex: none;
    background: transparent;
    box-sizing: border-box;
    transition: background 0.18s ease, box-shadow 0.25s ease, transform 0.12s ease;
  }
  .dia:hover {
    transform: rotate(45deg) scale(1.1);
  }
  .dia:focus-visible {
    outline: 2px solid var(--gl-blood);
    outline-offset: 1px;
  }
  .dia.on {
    background: var(--gl-blood-bright);
    box-shadow: 0 0 7px color-mix(in srgb, var(--gl-blood-bright) 45%, transparent);
  }
  .humanity {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .ubox {
    width: 20px;
    height: 20px;
    border: 1.5px solid var(--gl-ink);
    cursor: pointer;
    display: inline-block;
    flex: none;
    position: relative;
    background: transparent;
    box-sizing: border-box;
    transition: background 0.18s ease, border-color 0.12s ease;
  }
  .ubox:hover {
    border-color: var(--gl-blood);
  }
  .ubox:focus-visible {
    outline: 2px solid var(--gl-blood);
    outline-offset: 1px;
  }
  .ubox.on {
    background: var(--gl-ink);
  }
  /* The stain slash is always present but collapsed, so gaining a Stain draws
     the stroke in — the same knife-stroke read as the damage tracks. */
  .ubox::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 26px;
    transform: translate(-50%, -50%) rotate(45deg) scaleY(0);
    background: var(--gl-blood-bright);
    transition: transform 0.18s ease-out;
  }
  .ubox.stain::after {
    transform: translate(-50%, -50%) rotate(45deg) scaleY(1);
  }
  .stainctl {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--gl-cond);
    font-size: 10px;
    letter-spacing: 1px;
    color: var(--gl-muted);
  }
  .mini-btn {
    cursor: pointer;
    width: 16px;
    height: 16px;
    border: 1px solid var(--gl-ink);
    background: transparent;
    color: var(--gl-ink);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    line-height: 1;
    padding: 0;
  }
  .reso {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    padding: 5px 0;
    border-top: 1px dotted var(--gl-line-soft);
  }
  .reso-sel {
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 15px;
    text-align: right;
  }

  /* Expandable "what this level means" readout, shared by Humanity and Blood
     Potency. Collapsed it shows the rating + a one-line blurb; open it lists
     the mechanical effects. */
  .lvl-readout {
    display: flex;
    align-items: baseline;
    gap: 8px;
    width: 100%;
    margin-top: 8px;
    padding: 4px 2px;
    background: transparent;
    border: none;
    border-top: 1px dotted var(--gl-line-soft);
    cursor: pointer;
    text-align: left;
  }
  .lvl-num {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 16px;
    color: var(--gl-blood);
    line-height: 1;
    flex: none;
  }
  .lvl-blurb {
    flex: 1;
    font-size: 11.5px;
    font-style: italic;
    color: var(--gl-muted-2);
    line-height: 1.3;
  }
  .lvl-caret {
    flex: none;
    font-size: 10px;
    color: var(--gl-muted);
    transition: transform 0.12s;
    transform: rotate(0deg);
  }
  .lvl-caret.open {
    transform: rotate(90deg);
  }
  .lvl-effects {
    list-style: none;
    margin: 2px 0 6px;
    padding: 0;
  }
  .lvl-effects li {
    position: relative;
    padding: 3px 0 3px 14px;
    font-size: 11.5px;
    line-height: 1.35;
    color: var(--gl-ink);
    border-bottom: 1px dotted var(--gl-line-soft);
  }
  .lvl-effects li:last-child {
    border-bottom: none;
  }
  .lvl-effects li::before {
    content: "";
    position: absolute;
    left: 3px;
    top: 9px;
    width: 4px;
    height: 4px;
    transform: rotate(45deg);
    background: var(--gl-blood);
  }
  .reso-info {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dotted var(--gl-line-soft);
  }
  .reso-discs {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 3px;
  }
  .reso-bonus {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 13px;
    color: var(--gl-gold, #c8a86b);
  }
  .reso-disc-names {
    font-family: var(--gl-semi);
    font-weight: 600;
    font-size: 12px;
    color: var(--gl-ink);
  }
  .reso-note {
    margin: 0 0 3px;
    font-size: 11px;
    color: var(--gl-muted-2);
    line-height: 1.3;
  }
  .reso-emote {
    margin: 0;
    font-size: 11px;
    font-style: italic;
    color: var(--gl-muted);
    line-height: 1.3;
  }

  /* panels */
  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 1px solid var(--gl-line);
  }
  .panel {
    padding: 20px 26px;
  }
  .panel.brd {
    border-right: 1px solid var(--gl-line);
  }
  .disc {
    margin-bottom: 10px;
  }
  .disc-h {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  .caret {
    background: transparent;
    border: none;
    color: var(--gl-muted);
    cursor: pointer;
    font-size: 11px;
    padding: 0;
    transition: transform 0.12s;
    transform: rotate(0deg);
    line-height: 1;
  }
  .caret.open {
    transform: rotate(90deg);
  }
  .reveal {
    background: transparent;
    border: none;
    padding: 0;
    text-align: left;
    /* Foundry styles bare buttons as centered flex boxes; force names to the
       left edge so Disciplines read the same as Powers, advantages & gear. */
    justify-content: flex-start;
    cursor: pointer;
    color: inherit;
    font: inherit;
  }
  .disc-name {
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 18px;
    flex: 1;
    color: var(--gl-ink);
  }
  .disc-name:hover,
  .pw-name:hover,
  .adv-lbl:hover b,
  .eq-name:hover b {
    color: var(--gl-blood);
  }
  .mini-roll {
    background: transparent;
    border: none;
    color: var(--gl-blood);
    cursor: pointer;
    font-size: 14px;
    padding: 0 2px;
    line-height: 1;
    flex: none;
  }
  .mini-roll:hover {
    color: var(--gl-blood-bright);
  }
  .pw {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--gl-muted-2);
    padding: 2px 0 2px 12px;
    margin-left: 6px;
    border-left: 2px solid var(--gl-line);
  }
  .pw-lvl {
    font-family: var(--gl-cond);
    font-weight: 600;
    color: var(--gl-blood);
    width: 12px;
    text-align: center;
  }
  .pw-name {
    flex: 1;
    font-size: 12px;
    color: var(--gl-muted-2);
  }
  .detail {
    font-size: 12px;
    line-height: 1.5;
    color: var(--gl-muted-2);
    background: var(--gl-parch-raise);
    border-left: 2px solid var(--gl-blood);
    padding: 8px 12px;
    margin: 2px 0 8px;
  }
  .detail :global(p) {
    margin: 0 0 6px;
  }
  .detail :global(p:last-child) {
    margin-bottom: 0;
  }
  .pw-detail {
    margin-left: 20px;
  }
  .detail-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-family: var(--gl-cond);
    font-size: 11px;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .detail-facts b {
    color: var(--gl-blood);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    margin-right: 3px;
  }
  .sub-add {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 0 2px 20px;
    margin-left: 6px;
  }
  .sub-add:hover {
    color: var(--gl-blood);
  }

  /* advantages grouped by kind */
  .adv-group {
    margin-bottom: 12px;
  }
  .adv-group-h {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 10px;
    color: var(--gl-muted);
    border-bottom: 1px dotted var(--gl-line);
    padding-bottom: 2px;
    margin-bottom: 6px;
  }
  .adv-group-h[data-kind="background"] {
    color: var(--gl-gold);
  }
  .adv-group-h[data-kind="flaw"] {
    color: var(--gl-blood);
  }
  .adv {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 6px;
    padding-bottom: 5px;
    border-bottom: 1px dotted var(--gl-line-soft);
  }
  .adv-lbl {
    font-size: 13px;
    line-height: 1.25;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .adv-lbl b {
    font-family: var(--gl-semi);
    font-weight: 600;
  }
  .adv-lbl i {
    color: var(--gl-muted);
    font-size: 11px;
    margin-left: 5px;
  }
  .adv-detail {
    font-size: 11px;
    font-style: italic;
    color: var(--gl-gold);
    margin-left: 4px;
  }
  .adv-lbl.flaw b {
    color: var(--gl-blood);
  }
  .adv-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    font-family: var(--gl-cond);
    font-size: 10px;
    font-weight: 600;
    color: var(--gl-parch);
    background: var(--gl-muted);
    flex: none;
  }
  .adv-tag[data-kind="background"] {
    background: var(--gl-gold);
  }
  .adv-tag[data-kind="merit"] {
    background: var(--gl-good);
  }
  .adv-tag[data-kind="flaw"] {
    background: var(--gl-blood);
  }
  .adv-tag[data-kind="loresheet"] {
    background: var(--gl-ink-soft);
  }
  .eq {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
    padding-bottom: 5px;
    border-bottom: 1px dotted var(--gl-line-soft);
    font-size: 13px;
  }
  .eq-name {
    flex: 1;
  }
  .eq-name b {
    font-family: var(--gl-semi);
    font-weight: 600;
  }
  .eq-stat {
    font-family: var(--gl-cond);
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--gl-muted);
  }
  .eq-qty {
    font-family: var(--gl-cond);
    font-size: 12px;
    color: var(--gl-muted);
    width: 26px;
  }
  .eq-check {
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--gl-line);
    background: transparent;
    color: transparent;
    cursor: pointer;
    font-size: 11px;
    line-height: 1;
    padding: 0;
    flex: none;
    border-radius: 3px;
  }
  .eq-check.on {
    color: var(--gl-parch);
    background: var(--gl-blood);
    border-color: var(--gl-blood);
  }
  .empty {
    font-size: 12px;
    color: var(--gl-muted);
    font-style: italic;
    margin: 0 0 10px;
  }

  /* foot */
  .foot {
    display: grid;
    grid-template-columns: 1fr 300px;
    border-top: 1px solid var(--gl-line);
  }
  .conv {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
  }
  .conv-body {
    flex: 1;
  }
  .conv-q-in {
    font-family: var(--gl-serif);
    font-style: italic;
    font-weight: 600;
    font-size: 17px;
    width: 100%;
  }
  .conv-t {
    display: flex;
    align-items: baseline;
    font-size: 12px;
    color: var(--gl-muted-2);
    margin-top: 2px;
  }
  .conv-t-in {
    font-size: 12px;
    color: var(--gl-muted-2);
    flex: 1;
  }
  .xp {
    padding: 20px 22px;
    background: var(--gl-parch-raise);
  }
  .sect-h.ink {
    color: var(--gl-ink);
  }
  .xp-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
  }
  .xp-k {
    font-size: 12px;
    color: var(--gl-muted-2);
  }
  .xp-big {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 32px;
    color: var(--gl-blood);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    width: 90px;
    text-align: right;
  }
  .xp-row2 {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 12px;
    color: var(--gl-muted-2);
    border-top: 1px dotted var(--gl-line-soft);
    padding-top: 7px;
  }
  .xp-tot {
    font-weight: 600;
    color: var(--gl-ink);
    width: 60px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .xp-spend {
    margin-top: 12px;
    width: 100%;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 11px;
    color: var(--gl-parch);
    background: var(--gl-blood);
    border: 1px solid var(--gl-blood);
    padding: 8px;
    cursor: pointer;
  }
  .xp-spend:hover {
    background: var(--gl-blood-bright);
  }
</style>
