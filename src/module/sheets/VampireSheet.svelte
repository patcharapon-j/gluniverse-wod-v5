<script lang="ts">
  import { CLANS, PREDATOR_TYPES, RESONANCES, RESONANCE_INTENSITIES } from "../config.ts";
  import { prettify } from "../components/labels.ts";
  import DotRating from "../components/DotRating.svelte";
  import DamageTrack from "../components/DamageTrack.svelte";
  import AttributeGrid from "../components/AttributeGrid.svelte";
  import SkillGrid from "../components/SkillGrid.svelte";
  import ItemControls from "../components/ItemControls.svelte";
  import EffectsPanel from "../components/EffectsPanel.svelte";
  import { createItem, editItem, deleteItem } from "../apps/actor-items.ts";
  import { openRollDialog } from "../apps/RollDialogApp.ts";
  import { rouseCheck, remorseCheck, frenzyCheck } from "../dice/checks.ts";

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
  const advantages = $derived(items.filter((i) => i.type === "advantage"));
  const rituals = $derived(items.filter((i) => i.type === "ritual"));
  const ceremonies = $derived(items.filter((i) => i.type === "ceremony"));
  const weapons = $derived(items.filter((i) => i.type === "weapon"));
  const armor = $derived(items.filter((i) => i.type === "armor"));
  const gear = $derived(items.filter((i) => i.type === "gear"));
  const powersFor = (id: string) =>
    items.filter((i) => i.type === "power" && i.system.parentDiscipline === id);

  // --- local UI state -------------------------------------------------------
  let collapsed: Record<string, boolean> = $state({});
  let dragOver = $state(false);

  const toggle = (key: string) => (collapsed[key] = !collapsed[key]);

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
    const list = [...(sys.convictions ?? []), { conviction: "", touchstone: "" }];
    up("system.convictions", list);
  }
  function updateConviction(i: number, field: "conviction" | "touchstone", value: string) {
    const list = (sys.convictions ?? []).map((c: any, idx: number) =>
      idx === i ? { ...c, [field]: value } : c,
    );
    up("system.convictions", list);
  }
  function removeConviction(i: number) {
    const list = (sys.convictions ?? []).filter((_: any, idx: number) => idx !== i);
    up("system.convictions", list);
  }

  // --- drag & drop ----------------------------------------------------------
  function onDrop(event: DragEvent) {
    dragOver = false;
    app.glHandleDrop?.(event);
  }

  // --- rolls ----------------------------------------------------------------
  const rollAttr = (k: string) => openRollDialog(doc, { attribute: k });
  const rollSkill = (k: string) => openRollDialog(doc, { skill: k });
  const openPool = () => openRollDialog(doc, {});
</script>

<div
  class="gl-vampire"
  class:dragover={dragOver}
  role="region"
  aria-label="Vampire character sheet"
  ondragover={(e) => (e.preventDefault(), (dragOver = true))}
  ondragleave={() => (dragOver = false)}
  ondrop={onDrop}
>
  <!-- header -->
  <header class="hdr">
    <div class="spine"></div>
    <div class="hdr-top">
      <div class="idblock">
        <div class="eyebrow">Kindred · Player Character</div>
        <input
          class="name"
          value={snap.name}
          onchange={(e) => doc.update({ name: e.currentTarget.value })}
        />
      </div>
      <button class="roll-cta" onclick={openPool} title="Build a dice pool">Roll Pool</button>
      <div class="facts">
        <label class="fact">
          <span class="fk">Clan</span>
          <select value={sys.clan} onchange={(e) => up("system.clan", e.currentTarget.value)}>
            <option value="">—</option>
            {#each CLANS as c (c)}<option value={c}>{prettify(c)}</option>{/each}
          </select>
        </label>
        <label class="fact">
          <span class="fk">Generation</span>
          <input
            class="fv-in"
            type="number"
            min="3"
            max="16"
            value={sys.generation}
            onchange={(e) => up("system.generation", Number(e.currentTarget.value))}
          />
        </label>
        <label class="fact">
          <span class="fk">Predator</span>
          <select value={sys.predator} onchange={(e) => up("system.predator", e.currentTarget.value)}>
            <option value="">—</option>
            {#each PREDATOR_TYPES as p (p)}<option value={p}>{prettify(p)}</option>{/each}
          </select>
        </label>
      </div>
    </div>
    <div class="hdr-sub">
      {#each [["sire", "Sire"], ["details.ambition", "Ambition"], ["details.desire", "Desire"]] as const as [path, lbl] (path)}
        <label class="sub">
          <span class="mini-lbl">{lbl}</span>
          <input
            value={path.split(".").reduce((o: any, k) => o?.[k], sys)}
            onchange={(e) => up(`system.${path}`, e.currentTarget.value)}
          />
        </label>
      {/each}
    </div>
  </header>

  <!-- body -->
  <div class="body">
    <section class="left">
      <div class="sect-h">Attributes</div>
      <AttributeGrid
        attributes={sys.attributes}
        onrate={(k, n) => up(`system.attributes.${k}.value`, n)}
        onroll={rollAttr}
      />

      <div class="sect-h">Skills</div>
      <SkillGrid
        skills={sys.skills}
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
          onchange={(v) => doc.update({ "system.health.superficial": v.superficial, "system.health.aggravated": v.aggravated })}
        />
      </div>

      <div class="trk">
        <div class="trk-h">
          <span class="l">Willpower</span>
          <button class="chk-btn" onclick={() => frenzyCheck(doc)} title="Resist Frenzy">Frenzy</button>
        </div>
        <DamageTrack
          superficial={sys.willpower.superficial}
          aggravated={sys.willpower.aggravated}
          max={sys.willpower.max}
          onchange={(v) => doc.update({ "system.willpower.superficial": v.superficial, "system.willpower.aggravated": v.aggravated })}
        />
      </div>

      <div class="rail-div"></div>

      <div class="trk">
        <div class="trk-h">
          <span class="l blood">Hunger</span>
          <button class="chk-btn" onclick={() => rouseCheck(doc)} title="Rouse the Blood">Rouse</button>
        </div>
        <div class="diamonds">
          {#each Array.from({ length: 5 }, (_, i) => i) as i (i)}
            <span
              class="dia"
              class:on={i < sys.hunger}
              role="button"
              tabindex="0"
              aria-label={`Hunger ${i + 1}`}
              onclick={() => setHunger(i)}
              onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setHunger(i))}
            ></span>
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
      </div>

      <div class="rail-div"></div>

      <div class="trk">
        <div class="trk-h">
          <span class="l">Blood Potency</span>
          <DotRating
            value={sys.bloodPotency}
            max={10}
            size={11}
            color="blood"
            onchange={(n) => up("system.bloodPotency", n)}
          />
        </div>
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
      </div>
    </aside>
  </div>

  <!-- disciplines + advantages -->
  <div class="panels">
    <section class="panel brd">
      <div class="sect-h with-add">
        Disciplines
        <button class="add-btn" onclick={() => createItem(doc, "discipline")} title="Add discipline">+ Add</button>
      </div>
      {#if disciplines.length === 0}
        <p class="empty">Drag Discipline items here, or click <b>+ Add</b>.</p>
      {/if}
      {#each disciplines as d (d.id)}
        {@const powers = powersFor(d.id)}
        <div class="disc gl-hoverable" data-item-id={d.id}>
          <div class="disc-h">
            <button class="caret" class:open={!collapsed[d.id]} onclick={() => toggle(d.id)} aria-label="Toggle powers">▸</button>
            <span class="disc-name">{d.name}</span>
            <DotRating value={d.system.value} onchange={(n) => upItem(d.id, "system.value", n)} />
            <ItemControls onedit={() => editItem(doc, d.id)} ondelete={() => deleteItem(doc, d.id)} />
          </div>
          {#if !collapsed[d.id]}
            {#each powers as p (p.id)}
              <div class="pw gl-row" data-item-id={p.id}>
                <span class="pw-lvl">{p.system.level}</span>
                <span class="pw-name">{p.name}</span>
                <ItemControls onedit={() => editItem(doc, p.id)} ondelete={() => deleteItem(doc, p.id)} />
              </div>
            {/each}
            <button
              class="sub-add"
              onclick={() => createItem(doc, "power", { "system.parentDiscipline": d.id, "system.discipline": d.system.discipline })}
            >+ Power</button>
          {/if}
        </div>
      {/each}
    </section>

    <section class="panel">
      <div class="sect-h with-add">
        Advantages &amp; Flaws
        <button class="add-btn" onclick={() => createItem(doc, "advantage")} title="Add advantage">+ Add</button>
      </div>
      {#if advantages.length === 0}
        <p class="empty">Merits, Flaws, Backgrounds &amp; Loresheets.</p>
      {/if}
      {#each advantages as a (a.id)}
        <div class="adv gl-row" data-item-id={a.id}>
          <span class="adv-lbl" class:flaw={a.system.kind === "flaw"}>
            <b>{a.name}</b><i>· {prettify(a.system.kind)}</i>
          </span>
          <DotRating
            value={a.system.value}
            max={a.system.maxValue || 5}
            size={10}
            onchange={(n) => upItem(a.id, "system.value", n)}
          />
          <ItemControls onedit={() => editItem(doc, a.id)} ondelete={() => deleteItem(doc, a.id)} />
        </div>
      {/each}
    </section>
  </div>

  <!-- rituals / ceremonies + equipment -->
  <div class="panels">
    <section class="panel brd">
      <div class="sect-h with-add">
        Rituals &amp; Ceremonies
        <span class="add-group">
          <button class="add-btn" onclick={() => createItem(doc, "ritual")} title="Add Blood Sorcery ritual">+ Ritual</button>
          <button class="add-btn" onclick={() => createItem(doc, "ceremony")} title="Add Oblivion ceremony">+ Ceremony</button>
        </span>
      </div>
      {#if rituals.length === 0 && ceremonies.length === 0}
        <p class="empty">Blood Sorcery rituals &amp; Oblivion ceremonies.</p>
      {/if}
      {#each [...rituals, ...ceremonies] as r (r.id)}
        <div class="adv gl-row" data-item-id={r.id}>
          <span class="adv-lbl">
            <b>{r.name}</b><i>· {prettify(r.type)} {r.system.level}</i>
          </span>
          <ItemControls onedit={() => editItem(doc, r.id)} ondelete={() => deleteItem(doc, r.id)} />
        </div>
      {/each}
    </section>

    <section class="panel">
      <div class="sect-h with-add">
        Equipment
        <span class="add-group">
          <button class="add-btn" onclick={() => createItem(doc, "weapon")} title="Add weapon">+ Weapon</button>
          <button class="add-btn" onclick={() => createItem(doc, "armor")} title="Add armor">+ Armor</button>
          <button class="add-btn" onclick={() => createItem(doc, "gear")} title="Add gear">+ Gear</button>
        </span>
      </div>
      {#if weapons.length === 0 && armor.length === 0 && gear.length === 0}
        <p class="empty">Weapons, armor &amp; carried gear.</p>
      {/if}
      {#each weapons as w (w.id)}
        <div class="eq gl-row" data-item-id={w.id}>
          <button
            class="eq-check"
            class:on={w.system.equipped}
            aria-label="Toggle equipped"
            title="Equipped"
            onclick={() => upItem(w.id, "system.equipped", !w.system.equipped)}
          >✓</button>
          <span class="eq-name"><b>{w.name}</b></span>
          <span class="eq-stat">{w.system.damage} {w.system.damageType === "aggravated" ? "agg" : "sup"}</span>
          <ItemControls onedit={() => editItem(doc, w.id)} ondelete={() => deleteItem(doc, w.id)} />
        </div>
      {/each}
      {#each armor as a (a.id)}
        <div class="eq gl-row" data-item-id={a.id}>
          <button
            class="eq-check"
            class:on={a.system.equipped}
            aria-label="Toggle equipped"
            title="Equipped"
            onclick={() => upItem(a.id, "system.equipped", !a.system.equipped)}
          >✓</button>
          <span class="eq-name"><b>{a.name}</b></span>
          <span class="eq-stat">rating {a.system.rating}</span>
          <ItemControls onedit={() => editItem(doc, a.id)} ondelete={() => deleteItem(doc, a.id)} />
        </div>
      {/each}
      {#each gear as g (g.id)}
        <div class="eq gl-row" data-item-id={g.id}>
          <span class="eq-qty">×{g.system.quantity}</span>
          <span class="eq-name"><b>{g.name}</b></span>
          <ItemControls onedit={() => editItem(doc, g.id)} ondelete={() => deleteItem(doc, g.id)} />
        </div>
      {/each}
    </section>
  </div>

  <!-- convictions + xp -->
  <div class="foot">
    <section class="panel brd">
      <div class="sect-h with-add">
        Convictions &amp; Touchstones
        <button class="add-btn" onclick={addConviction} title="Add conviction">+ Add</button>
      </div>
      {#if (sys.convictions ?? []).length === 0}
        <p class="empty">No convictions recorded.</p>
      {/if}
      {#each sys.convictions ?? [] as c, i (i)}
        <div class="conv gl-row">
          <div class="conv-body">
            <input
              class="conv-q-in"
              placeholder="Conviction…"
              value={c.conviction}
              onchange={(e) => updateConviction(i, "conviction", e.currentTarget.value)}
            />
            <label class="conv-t">
              <span class="mini-lbl">Touchstone</span>
              <input
                class="conv-t-in"
                placeholder="Name…"
                value={c.touchstone}
                onchange={(e) => updateConviction(i, "touchstone", e.currentTarget.value)}
              />
            </label>
          </div>
          <ItemControls ondelete={() => removeConviction(i)} />
        </div>
      {/each}
    </section>
    <section class="xp">
      <div class="sect-h ink">Experience</div>
      <label class="xp-row">
        <span class="xp-k">Unspent</span>
        <input
          class="xp-big"
          type="number"
          min="0"
          value={sys.xp?.value ?? 0}
          onchange={(e) => up("system.xp.value", Number(e.currentTarget.value))}
        />
      </label>
      <label class="xp-row2">
        <span>Total earned</span>
        <input
          class="xp-tot"
          type="number"
          min="0"
          value={sys.xp?.total ?? 0}
          onchange={(e) => up("system.xp.total", Number(e.currentTarget.value))}
        />
      </label>
    </section>
  </div>

  <div class="effects-wrap">
    <EffectsPanel {doc} {snap} />
  </div>
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
  input:hover,
  select:hover {
    border-bottom-color: var(--gl-line);
  }
  input:focus,
  select:focus {
    outline: none;
    border-bottom-color: var(--gl-blood);
  }

  /* header */
  .hdr {
    padding: 26px 34px 20px;
    border-bottom: 2px solid var(--gl-ink);
    position: relative;
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
  .facts {
    display: flex;
    gap: 26px;
    text-align: right;
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
    font-size: 22px;
    text-align: right;
  }
  .fv-in {
    width: 70px;
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

  /* body */
  .body {
    display: grid;
    grid-template-columns: 1fr 300px;
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
    line-height: 1.4;
  }
  .add-btn:hover {
    border-color: var(--gl-blood);
    background: color-mix(in srgb, var(--gl-blood) 8%, transparent);
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
  /* rail */
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
  .diamonds {
    display: flex;
    gap: 8px;
  }
  .dia {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    transform: rotate(45deg);
    border: 1.5px solid var(--gl-blood);
    cursor: pointer;
    display: inline-block;
    flex: none;
    background: transparent;
    box-sizing: border-box;
  }
  .dia.on {
    background: var(--gl-blood-bright);
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
  }
  .ubox.on {
    background: var(--gl-ink);
  }
  .ubox.stain::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 26px;
    transform: translate(-50%, -50%) rotate(45deg);
    background: var(--gl-blood-bright);
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
    padding: 6px 0;
    border-top: 1px dotted var(--gl-line-soft);
  }
  .reso-sel {
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 15px;
    text-align: right;
  }

  /* panels */
  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 1px solid var(--gl-line);
  }
  .panel {
    padding: 22px 30px;
  }
  .panel.brd {
    border-right: 1px solid var(--gl-line);
  }
  .disc {
    margin-bottom: 12px;
  }
  .disc-h {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
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
  .disc-name {
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 18px;
    flex: 1;
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
  .adv {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
    padding-bottom: 7px;
    border-bottom: 1px dotted var(--gl-line-soft);
  }
  .adv-lbl {
    font-size: 13px;
    line-height: 1.25;
    flex: 1;
  }
  .adv-lbl b {
    font-family: var(--gl-semi);
    font-weight: 600;
  }
  .adv-lbl i {
    color: var(--gl-muted);
    font-size: 11px;
  }
  .adv-lbl.flaw b {
    color: var(--gl-blood);
  }
  .eq {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 7px;
    padding-bottom: 6px;
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
    padding: 22px 24px;
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
    font-size: 34px;
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
</style>
