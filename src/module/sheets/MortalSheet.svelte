<script lang="ts">
  import { slide } from "svelte/transition";
  import { prettify } from "../components/labels.ts";
  import DotRating from "../components/DotRating.svelte";
  import DamageTrack from "../components/DamageTrack.svelte";
  import AttributeGrid from "../components/AttributeGrid.svelte";
  import SkillGrid from "../components/SkillGrid.svelte";
  import ItemControls from "../components/ItemControls.svelte";
  import EffectsPanel from "../components/EffectsPanel.svelte";
  import Portrait from "../components/Portrait.svelte";
  import { createItem, editItem, deleteItem } from "../apps/actor-items.ts";
  import { openRollDialog, rollWeapon } from "../apps/RollDialogApp.ts";
  import { pickImage } from "../apps/image.ts";
  import { openXpDialog } from "../apps/XpDialogApp.ts";
  import { openChatArtConfig } from "../apps/ChatArtConfigApp.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    doc: any;
    snap: any;
    app: any;
  }
  let { doc, snap, app }: Props = $props();

  const sys = $derived(snap.system);
  const items = $derived(snap.items as any[]);
  const isGhoul = $derived(doc.type === "ghoul");

  // Permission gates (see VampireSheet for the mechanism).
  const editable = $derived(snap.editable as boolean);
  const limited = $derived(snap.limited as boolean);

  // Resolve the linked regnant actor (if any) so we can show a portrait + link.
  const regnant = $derived.by(() => {
    const uuid = sys.bloodBond?.regnantUuid;
    if (!uuid) return null;
    try {
      return (foundry.utils as any)?.fromUuidSync?.(uuid) ?? (globalThis as any).fromUuidSync?.(uuid) ?? null;
    } catch {
      return null;
    }
  });

  const disciplines = $derived(items.filter((i) => i.type === "discipline"));
  const powersFor = (discipline: any) => items.filter((i) => i.type === "power" && i.system.discipline === discipline.system.discipline);
  const advantages = $derived(items.filter((i) => i.type === "advantage"));
  const equipment = $derived(items.filter((i) => ["weapon", "armor", "gear"].includes(i.type)));

  let dragOver = $state(false);
  let editMode = $state(false);
  const edit = $derived(editMode && editable);
  let expanded: Record<string, boolean> = $state({});
  const reveal = (key: string) => (expanded[key] = !expanded[key]);

  // Marquee copy for the edit-mode frame; two identical spans scroll -50% for a
  // seamless loop.
  const EDIT_TICKER = "EDIT MODE · ".repeat(24);

  function up(path: string, value: unknown) {
    if (!editable) return;
    doc.update({ [path]: value });
  }
  const upItem = (id: string, path: string, value: unknown) => {
    if (!editable) return;
    doc.items.get(id)?.update({ [path]: value });
  };
  const bumpStain = (d: number) =>
    up("system.humanity.stains", Math.max(0, Math.min(10, (sys.humanity.stains ?? 0) + d)));
  const setHumanity = (i: number) => up("system.humanity.value", sys.humanity.value === i + 1 ? i : i + 1);

  const rollAttr = (k: string) => openRollDialog(doc, { attribute: k });
  const rollSkill = (k: string) => openRollDialog(doc, { skill: k });
  const openPool = () => openRollDialog(doc, {});

  function onDrop(event: DragEvent) {
    dragOver = false;
    app.glHandleDrop?.(event);
  }

  const setDrinks = (i: number) => up("system.bloodBond.drinks", (sys.bloodBond?.drinks ?? 0) === i + 1 ? i : i + 1);

  function openRegnant() {
    (regnant as any)?.sheet?.render(true);
  }

  // Drop an Actor from the sidebar onto the bond panel to link the regnant.
  function onRegnantDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!editable) return;
    let data: any = {};
    try {
      data = JSON.parse(event.dataTransfer?.getData("text/plain") ?? "{}");
    } catch {
      data = {};
    }
    if (data?.type === "Actor" && data.uuid) {
      up("system.bloodBond.regnantUuid", data.uuid);
    }
  }
</script>

<div
  class="gl-mortal"
  class:dragover={dragOver}
  class:editing={edit}
  role="region"
  aria-label="{prettify(doc.type)} sheet"
  ondragover={(e) => (e.preventDefault(), (dragOver = true))}
  ondragleave={() => (dragOver = false)}
  ondrop={onDrop}
>
  {#if limited}
    <header class="hdr">
      <div class="spine"></div>
      <Portrait img={snap.img} name={snap.name} />
      <div class="hdr-main">
        <div class="eyebrow">{isGhoul ? "Ghoul · Blood-Bound" : "Mortal"} · World of Darkness</div>
        <div class="name">{snap.name}</div>
      </div>
    </header>
    <div class="foot">
      <div class="sect-h">Biography</div>
      {#if sys.biography}
        <div class="bio-html">{@html sys.biography}</div>
      {:else}
        <p class="empty">No biography recorded.</p>
      {/if}
    </div>
  {:else}
  {#if edit}
    <div class="edit-marquee top" aria-hidden="true">
      <div class="edit-marquee-track"><span>{EDIT_TICKER}</span><span>{EDIT_TICKER}</span></div>
    </div>
  {/if}
  <header class="hdr">
    <div class="spine"></div>
    <Portrait img={snap.img} name={snap.name} editable={edit} onedit={() => pickImage(doc)} />
    <div class="hdr-main">
      <div class="hdr-top">
        <div class="idblock">
          <div class="eyebrow">{isGhoul ? "Ghoul · Blood-Bound" : "Mortal"} · World of Darkness</div>
          <input class="name" value={snap.name} disabled={!edit} onchange={(e) => doc.update({ name: e.currentTarget.value })} />
        </div>
        <div class="hdr-tools">
          {#if editable}
            <button class="mode-toggle" onclick={() => openXpDialog(doc)} title="Spend and review experience">{sys.xp?.value ?? 0} XP</button>
            <button class="mode-toggle" onclick={() => openChatArtConfig(doc)} title="Frame this actor's chat-card image">Chat Art</button>
            <button class="mode-toggle" class:on={editMode} onclick={() => (editMode = !editMode)} title="Toggle play / edit">
              {editMode ? "🔓 Edit" : "🔒 Play"}
            </button>
            <button class="roll-cta" onclick={openPool} title="Build a dice pool">Roll Pool</button>
          {/if}
        </div>
      </div>
      <div class="hdr-sub">
        {#each [["details.concept", "Concept"], ["details.ambition", "Ambition"], ["details.desire", "Desire"]] as const as [path, lbl] (path)}
          <label class="sub">
            <span class="mini-lbl">{lbl}</span>
            <input value={path.split(".").reduce((o: any, k) => o?.[k], sys)} disabled={!edit} onchange={(e) => up(`system.${path}`, e.currentTarget.value)} />
          </label>
        {/each}
        <label class="sub">
          <span class="mini-lbl">Unspent XP</span>
          <input type="number" min="0" value={sys.xp?.value ?? 0} disabled={!edit} onchange={(e) => up("system.xp.value", Number(e.currentTarget.value))} />
        </label>
        <label class="sub">
          <span class="mini-lbl">Total XP</span>
          <input type="number" min="0" value={sys.xp?.total ?? 0} disabled={!edit} onchange={(e) => up("system.xp.total", Number(e.currentTarget.value))} />
        </label>
      </div>
    </div>
  </header>

  <div class="body">
    <section class="left">
      <div class="sect-h">Attributes</div>
      <AttributeGrid attributes={sys.attributes} readonly={!edit} onrate={(k, n) => up(`system.attributes.${k}.value`, n)} onroll={rollAttr} />
      <div class="sect-h">Skills</div>
      <SkillGrid
        skills={sys.skills}
        readonly={!edit}
        onrate={(k, n) => up(`system.skills.${k}.value`, n)}
        onspec={(k, list) => up(`system.skills.${k}.specialties`, list)}
        onroll={rollSkill}
      />
    </section>

    <aside class="rail">
      <div class="trk">
        <div class="trk-h"><span class="l">Health</span><span class="r">/ superficial · ✕ aggravated</span></div>
        <DamageTrack
          superficial={sys.health.superficial}
          aggravated={sys.health.aggravated}
          max={sys.health.max}
          disabled={!editable}
          onchange={(v) => editable && doc.update({ "system.health.superficial": v.superficial, "system.health.aggravated": v.aggravated })}
        />
      </div>
      <div class="trk">
        <div class="trk-h"><span class="l">Willpower</span></div>
        <DamageTrack
          superficial={sys.willpower.superficial}
          aggravated={sys.willpower.aggravated}
          max={sys.willpower.max}
          disabled={!editable}
          onchange={(v) => editable && doc.update({ "system.willpower.superficial": v.superficial, "system.willpower.aggravated": v.aggravated })}
        />
      </div>

      <div class="rail-div"></div>

      <div class="trk">
        <div class="trk-h">
          <span class="l">Humanity</span>
          {#if editable}
            <span class="stainctl">
              Stains
              <button class="mini-btn" onclick={() => bumpStain(-1)} aria-label="Decrease stains">–</button>
              <button class="mini-btn" onclick={() => bumpStain(1)} aria-label="Increase stains">+</button>
            </span>
          {/if}
        </div>
        <div class="humanity">
          {#each Array.from({ length: 10 }, (_, i) => i) as i (i)}
            <span
              class="ubox"
              class:on={i < sys.humanity.value}
              class:stain={i >= 10 - (sys.humanity.stains ?? 0)}
              role="button"
              tabindex="0"
              aria-label={`Humanity ${i + 1}`}
              onclick={() => setHumanity(i)}
              onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setHumanity(i))}
            ></span>
          {/each}
        </div>
        {#if sys.humanityImpaired}
          <div class="impair-badge" title="Stains overlap remaining Humanity">
            Impaired — stains overlap Humanity (−2 dice)
          </div>
        {/if}
      </div>

      {#if isGhoul}
        <div class="rail-div"></div>
        <div class="trk">
          <div class="trk-h"><span class="l blood">Vitae</span></div>
          <DotRating value={sys.vitae ?? 0} max={10} size={12} color="blood" readonly={!edit} onchange={(n) => up("system.vitae", n)} />
        </div>

        <!-- Blood Bond panel: drop an Actor here to link the regnant. -->
        <section
          class="bond"
          class:droppable={edit}
          ondragover={(e) => edit && e.preventDefault()}
          ondrop={onRegnantDrop}
          role="group"
          aria-label="Blood Bond"
        >
          <div class="trk-h"><span class="l blood">Blood Bond</span></div>

          {#if regnant}
            <button class="regnant-card" onclick={openRegnant} title="Open {(regnant as any).name}'s sheet">
              <img class="regnant-img" src={(regnant as any).img} alt="" onerror={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")} />
              <span class="regnant-meta">
                <span class="regnant-lbl">Regnant (Domitor)</span>
                <span class="regnant-name">{(regnant as any).name}</span>
              </span>
              {#if edit}
                <span
                  class="regnant-clear"
                  role="button"
                  tabindex="0"
                  title="Unlink regnant"
                  aria-label="Unlink regnant"
                  onclick={(e) => (e.stopPropagation(), up("system.bloodBond.regnantUuid", ""))}
                  onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), e.stopPropagation(), up("system.bloodBond.regnantUuid", ""))}
                >✕</span>
              {/if}
            </button>
          {:else if edit}
            <p class="bond-hint">Drop an Actor here to link the regnant.</p>
          {/if}

          <label class="ghoul-f">
            <span class="mini-lbl">Regnant (Domitor)</span>
            <input value={sys.bloodBond?.regnant ?? ""} disabled={!edit} placeholder="Name" onchange={(e) => up("system.bloodBond.regnant", e.currentTarget.value)} />
          </label>

          <div class="trk-h" style="margin-top:8px">
            <span class="l">Bond Rating</span>
            <DotRating value={sys.bloodBond?.rating ?? 0} max={6} size={11} color="blood" readonly={!edit} onchange={(n) => up("system.bloodBond.rating", n)} />
          </div>

          <div class="drinks">
            <span class="mini-lbl">Drinks this cycle</span>
            <span class="pips">
              {#each [0, 1, 2] as i (i)}
                <span
                  class="pip"
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

          <p class="bond-note">
            A ghoul must drink vitae at least once a month or begin aging; the bond fades after (7 − rating) months without drinking.
          </p>
        </section>
      {/if}
    </aside>
  </div>

  <div class="panels" class:three={isGhoul}>
    {#if isGhoul}
      <section class="panel brd">
        <div class="sect-h with-add">
          Disciplines
          {#if edit}<button class="add-btn" onclick={() => createItem(doc, "discipline")}>+ Add</button>{/if}
        </div>
        {#if disciplines.length === 0}<p class="empty">Ghouls may hold a dot or two.</p>{/if}
        {#each disciplines as d (d.id)}
          <div class="line gl-row" data-item-id={d.id}>
            <span class="line-name">{d.name}</span>
            <DotRating value={d.system.value} max={5} size={13} readonly={!edit} onchange={(n) => upItem(d.id, "system.value", n)} />
            {#if edit}<ItemControls onedit={() => editItem(doc, d.id)} ondelete={() => deleteItem(doc, d.id)} />{/if}
          </div>
          {#each powersFor(d) as power (power.id)}
            <div class="line ghoul-power gl-row" data-item-id={power.id}>
              <span class="line-name">↳ {power.name}</span>
              {#if edit}<ItemControls onedit={() => editItem(doc, power.id)} ondelete={() => deleteItem(doc, power.id)} />{/if}
            </div>
          {/each}
        {/each}
      </section>
    {/if}

    <section class="panel brd">
      <div class="sect-h with-add">
        Advantages &amp; Flaws
        {#if edit}<button class="add-btn" onclick={() => createItem(doc, "advantage")}>+ Add</button>{/if}
      </div>
      {#if advantages.length === 0}<p class="empty">Merits, Flaws &amp; Backgrounds.</p>{/if}
      {#each advantages as a (a.id)}
        <div class="line gl-row" data-item-id={a.id}>
          <span class="line-name" class:flaw={a.system.kind === "flaw"}><b>{a.name}</b> <i>· {prettify(a.system.kind)}</i></span>
          <DotRating value={a.system.value} max={a.system.maxValue || 5} size={13} readonly={!edit} onchange={(n) => upItem(a.id, "system.value", n)} />
          {#if edit}<ItemControls onedit={() => editItem(doc, a.id)} ondelete={() => deleteItem(doc, a.id)} />{/if}
        </div>
      {/each}
    </section>

    <section class="panel">
      <div class="sect-h with-add">
        Equipment
        {#if edit}
          <span class="add-group">
            <button class="add-btn" onclick={() => createItem(doc, "weapon")}>+ Weapon</button>
            <button class="add-btn" onclick={() => createItem(doc, "gear")}>+ Gear</button>
          </span>
        {/if}
      </div>
      {#if equipment.length === 0}<p class="empty">Weapons, armor &amp; gear.</p>{/if}
      {#each equipment as g (g.id)}
        <div class="line gl-row" data-item-id={g.id}>
          <button class="line-name reveal" onclick={() => reveal(g.id)} title="Show detail"><b>{g.name}</b> <i>· {prettify(g.type)}</i></button>
          {#if g.type === "weapon" && editable}
            <button class="mini-roll" onclick={() => rollWeapon(doc, g)} title="Roll {g.name}" aria-label="Roll">⚄</button>
          {/if}
          {#if edit}<ItemControls onedit={() => editItem(doc, g.id)} ondelete={() => deleteItem(doc, g.id)} />{/if}
        </div>
        {#if expanded[g.id]}
          <div class="detail" transition:slide={{ duration: 150 }}>
            <div class="detail-facts">
              {#if g.type === "weapon"}
                <span><b>Damage</b> {g.system.damage} {g.system.damageType}</span>
                {#if g.system.pool}<span><b>Pool</b> {g.system.pool}</span>{/if}
                {#if g.system.range}<span><b>Range</b> {g.system.range}</span>{/if}
                {#if g.system.concealment}<span><b>Conceal</b> {g.system.concealment}</span>{/if}
              {:else if g.type === "armor"}
                <span><b>Rating</b> {g.system.rating}</span>
                {#if g.system.type}<span><b>Type</b> {g.system.type}</span>{/if}
                {#if g.system.penalty}<span><b>Penalty</b> {g.system.penalty}</span>{/if}
              {:else}
                <span><b>Qty</b> {g.system.quantity}</span>
                {#if g.system.cost}<span><b>Cost</b> {g.system.cost}</span>{/if}
              {/if}
            </div>
            {#if g.system.description}<div class="detail-body">{@html g.system.description}</div>{/if}
          </div>
        {/if}
      {/each}
    </section>
  </div>

  <div class="foot">
    <button class="sect-h collapse" onclick={() => reveal("bio")} aria-expanded={expanded["bio"] ?? false}>
      Biography <span class="chev">{expanded["bio"] ? "▾" : "▸"}</span>
    </button>
    {#if expanded["bio"]}
      <div class="bio-body" transition:slide={{ duration: 150 }}>
        {#if edit}
          <textarea rows="8" value={sys.biography} onchange={(e) => up("system.biography", e.currentTarget.value)}></textarea>
        {:else if sys.biography}
          <div class="bio-html">{@html sys.biography}</div>
        {:else}
          <p class="empty">No biography yet. Switch to Edit mode to write one.</p>
        {/if}
      </div>
    {/if}
  </div>

  <div class="foot">
    <EffectsPanel {doc} {snap} {editable} />
  </div>

  {#if edit}
    <div class="edit-marquee bottom" aria-hidden="true">
      <div class="edit-marquee-track"><span>{EDIT_TICKER}</span><span>{EDIT_TICKER}</span></div>
    </div>
  {/if}
  {/if}
</div>

<style>
  .gl-mortal {
    width: 960px;
    max-width: 100%;
    margin: 0 auto;
    background: var(--gl-parch);
    color: var(--gl-ink);
    font-family: var(--gl-body);
    position: relative;
  }
  /* edit mode — unmistakably different from play mode */
  .gl-mortal.editing {
    box-shadow: inset 0 0 0 3px var(--gl-gold);
  }
  .gl-mortal.editing .spine {
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
  .gl-mortal.editing input:not(:disabled) {
    border-bottom-color: var(--gl-line);
    background: color-mix(in srgb, var(--gl-gold) 9%, transparent);
  }
  .gl-mortal.dragover::after {
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
  textarea {
    font-family: inherit;
    color: var(--gl-ink);
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
  }
  input:hover:not(:disabled) {
    border-bottom-color: var(--gl-line);
  }
  input:focus {
    outline: none;
    border-bottom-color: var(--gl-blood);
  }
  input:disabled {
    color: var(--gl-ink);
    opacity: 1;
    cursor: default;
  }
  .hdr {
    padding: 22px 30px 18px;
    border-bottom: 2px solid var(--gl-ink);
    position: relative;
    display: flex;
    gap: 20px;
    align-items: stretch;
  }
  .hdr-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .hdr-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
  }
  .mode-toggle {
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
  .mode-toggle:hover {
    border-color: var(--gl-blood);
    color: var(--gl-blood);
  }
  .mode-toggle.on:hover {
    color: var(--gl-ink);
    border-color: var(--gl-ink);
    background: color-mix(in srgb, var(--gl-gold) 82%, white);
  }
  .spine {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: var(--gl-blood);
  }
  .hdr-top {
    display: flex;
    align-items: flex-end;
    gap: 20px;
  }
  .idblock {
    flex: 1;
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
    font-size: 44px;
    line-height: 1;
    margin-top: 4px;
    width: 100%;
  }
  .roll-cta {
    align-self: center;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 11px;
    color: var(--gl-parch);
    background: var(--gl-blood);
    border: 1px solid var(--gl-blood);
    padding: 7px 14px;
    cursor: pointer;
  }
  .roll-cta:hover {
    background: var(--gl-blood-bright);
  }
  .hdr-sub {
    display: flex;
    gap: 34px;
    margin-top: 14px;
    flex-wrap: wrap;
  }
  .sub {
    font-size: 13px;
    display: inline-flex;
    align-items: baseline;
  }
  .mini-lbl {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 9px;
    color: var(--gl-muted);
    margin-right: 6px;
  }
  .body {
    display: grid;
    grid-template-columns: 1fr 280px;
  }
  .left {
    padding: 26px 30px;
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
    margin-bottom: 16px;
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
  }
  .add-btn:hover {
    border-color: var(--gl-blood);
  }
  .rail {
    padding: 26px 24px;
    background: var(--gl-parch-raise);
  }
  .trk {
    margin-bottom: 20px;
  }
  .trk-h {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
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
    margin: 0 -24px 20px;
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
    transition: background 0.18s ease, border-color 0.12s ease;
    cursor: pointer;
    display: inline-block;
    flex: none;
    position: relative;
    background: transparent;
    box-sizing: border-box;
  }
  .ubox.on {
    background: var(--gl-ink);
  }
  .ubox:hover {
    border-color: var(--gl-blood);
  }
  .ubox:focus-visible {
    outline: 2px solid var(--gl-blood);
    outline-offset: 1px;
  }
  /* Stain slash draws in like the damage-track strokes. */
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
  .ghoul-f {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .ghoul-f input {
    border-bottom: 1px solid var(--gl-line);
  }
  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 1px solid var(--gl-line);
  }
  .panels.three {
    grid-template-columns: 1fr 1fr 1fr;
  }
  .panel {
    padding: 22px 26px;
  }
  .panel.brd {
    border-right: 1px solid var(--gl-line);
  }
  .line {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 7px;
    padding-bottom: 6px;
    border-bottom: 1px dotted var(--gl-line-soft);
    font-size: 13px;
  }
  .line-name {
    flex: 1;
  }
  .ghoul-power {
    margin-left: 14px;
    color: var(--gl-muted-2);
    font-size: 11px;
  }
  .line-name b {
    font-family: var(--gl-semi);
    font-weight: 600;
  }
  .line-name i {
    color: var(--gl-muted);
    font-size: 11px;
  }
  .line-name.flaw b {
    color: var(--gl-blood);
  }
  .reveal {
    background: transparent;
    border: none;
    padding: 0;
    text-align: left;
    cursor: pointer;
    color: inherit;
    font: inherit;
  }
  .reveal:hover b {
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
  .empty {
    font-size: 12px;
    color: var(--gl-muted);
    font-style: italic;
    margin: 0 0 10px;
  }
  .foot {
    padding: 22px 30px;
    border-top: 1px solid var(--gl-line);
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--gl-line);
    background: var(--gl-parch-raise);
    padding: 8px;
    resize: vertical;
  }

  /* Humanity impairment warning badge. */
  .impair-badge {
    margin-top: 8px;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    font-weight: 600;
    color: var(--gl-parch);
    background: var(--gl-blood);
    border: 1px solid var(--gl-blood);
    padding: 3px 7px;
    line-height: 1.3;
  }

  /* Blood Bond panel. */
  .bond {
    margin-bottom: 20px;
    padding: 10px;
    margin-left: -10px;
    margin-right: -10px;
    border: 1px solid transparent;
  }
  .bond.droppable {
    border: 1px dashed var(--gl-line);
    border-radius: 3px;
  }
  .bond.droppable:hover {
    border-color: var(--gl-blood);
  }
  .regnant-card {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    text-align: left;
    padding: 5px;
    margin-bottom: 8px;
    background: var(--gl-parch-raise);
    border: 1px solid var(--gl-line);
    border-left: 2px solid var(--gl-blood);
    cursor: pointer;
    font: inherit;
    color: inherit;
    position: relative;
  }
  .regnant-card:hover {
    border-color: var(--gl-blood);
  }
  .regnant-img {
    width: 34px;
    height: 34px;
    object-fit: cover;
    border: 1px solid var(--gl-line);
    flex: none;
  }
  .regnant-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .regnant-lbl {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 8px;
    color: var(--gl-muted);
  }
  .regnant-name {
    font-family: var(--gl-semi);
    font-weight: 600;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .regnant-clear {
    margin-left: auto;
    color: var(--gl-muted);
    font-size: 12px;
    line-height: 1;
    padding: 2px 4px;
    cursor: pointer;
  }
  .regnant-clear:hover {
    color: var(--gl-blood);
  }
  .bond-hint {
    font-family: var(--gl-cond);
    font-size: 10px;
    letter-spacing: 1px;
    color: var(--gl-muted);
    font-style: italic;
    margin: 0 0 8px;
  }
  .drinks {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
  }
  .pips {
    display: inline-flex;
    gap: 5px;
  }
  .pip {
    width: 13px;
    height: 13px;
    border: 1.5px solid var(--gl-blood);
    border-radius: 50%;
    cursor: pointer;
    box-sizing: border-box;
    background: transparent;
    transition: background 0.14s ease;
  }
  .pip.on {
    background: var(--gl-blood);
  }
  .pip:hover {
    border-color: var(--gl-blood-bright);
  }
  .pip:focus-visible {
    outline: 2px solid var(--gl-blood);
    outline-offset: 1px;
  }
  .bond-note {
    margin: 10px 0 0;
    font-size: 10px;
    line-height: 1.4;
    color: var(--gl-muted);
    font-style: italic;
  }

  /* Collapsible biography. */
  .sect-h.collapse {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }
  .sect-h.collapse .chev {
    font-size: 11px;
    color: var(--gl-muted);
  }
  .sect-h.collapse:hover {
    color: var(--gl-blood-bright);
  }
  .bio-body {
    margin-top: 12px;
  }
  .bio-html {
    font-size: 13px;
    line-height: 1.6;
    color: var(--gl-ink);
  }
  .bio-html :global(p) {
    margin: 0 0 8px;
  }
</style>
