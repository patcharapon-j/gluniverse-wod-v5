<script lang="ts">
  import { ATTRIBUTES, SKILLS, CLANS, PREDATOR_TYPES } from "../config.ts";
  import { label, prettify } from "../components/labels.ts";
  import DotRating from "../components/DotRating.svelte";
  import DamageTrack from "../components/DamageTrack.svelte";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    doc: any;
    state: any;
    app: any;
  }
  let { doc, state }: Props = $props();

  const sys = $derived(state.system);
  const items = $derived(state.items as any[]);

  const disciplines = $derived(items.filter((i) => i.type === "discipline"));
  const advantages = $derived(items.filter((i) => i.type === "advantage"));
  const powersFor = (disc: string) =>
    items.filter((i) => i.type === "power" && i.system.discipline === disc);

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
</script>

<div class="gl-vampire">
  <!-- header -->
  <header class="hdr">
    <div class="spine"></div>
    <div class="hdr-top">
      <div class="idblock">
        <div class="eyebrow">Kindred · Player Character</div>
        <input
          class="name"
          value={state.name}
          onchange={(e) => doc.update({ name: e.currentTarget.value })}
        />
      </div>
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
      <div class="triad">
        {#each Object.entries(ATTRIBUTES) as [cat, keys] (cat)}
          <div class="col">
            <div class="col-h">{prettify(cat)}</div>
            {#each keys as k (k)}
              <div class="row">
                <span class="at-name">{label("Attributes", k)}</span>
                <DotRating
                  value={sys.attributes[k].value}
                  onchange={(n) => up(`system.attributes.${k}.value`, n)}
                />
              </div>
            {/each}
          </div>
        {/each}
      </div>

      <div class="sect-h">Skills</div>
      <div class="triad">
        {#each Object.entries(SKILLS) as [cat, keys] (cat)}
          <div class="col">
            <div class="col-h">{prettify(cat)}</div>
            {#each keys as k (k)}
              {@const spec = (sys.skills[k].specialties ?? []).join(", ")}
              <div class="row" title={spec}>
                <span class="sk-name" class:has-spec={spec}>{label("Skills", k)}</span>
                <DotRating
                  value={sys.skills[k].value}
                  size={11}
                  onchange={(n) => up(`system.skills.${k}.value`, n)}
                />
              </div>
            {/each}
          </div>
        {/each}
      </div>
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
        <div class="trk-h"><span class="l">Willpower</span></div>
        <DamageTrack
          superficial={sys.willpower.superficial}
          aggravated={sys.willpower.aggravated}
          max={sys.willpower.max}
          onchange={(v) => doc.update({ "system.willpower.superficial": v.superficial, "system.willpower.aggravated": v.aggravated })}
        />
      </div>

      <div class="rail-div"></div>

      <div class="trk">
        <div class="trk-h"><span class="l blood">Hunger</span></div>
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
          <input
            class="reso-in"
            value={sys.resonance?.type ?? ""}
            onchange={(e) => up("system.resonance.type", e.currentTarget.value)}
          />
        </div>
      </div>
    </aside>
  </div>

  <!-- disciplines + advantages -->
  <div class="panels">
    <section class="panel brd">
      <div class="sect-h">Disciplines</div>
      {#if disciplines.length === 0}
        <p class="empty">Drag Discipline items onto the sheet.</p>
      {/if}
      {#each disciplines as d (d.id)}
        <div class="disc">
          <div class="disc-h">
            <span class="disc-name">{d.name}</span>
            <DotRating value={d.system.value} onchange={(n) => upItem(d.id, "system.value", n)} />
          </div>
          {#each powersFor(d.system.discipline) as p (p.id)}
            <div class="pw">{p.name}</div>
          {/each}
        </div>
      {/each}
    </section>

    <section class="panel">
      <div class="sect-h">Advantages &amp; Flaws</div>
      {#if advantages.length === 0}
        <p class="empty">Drag Merit / Flaw / Background items here.</p>
      {/if}
      {#each advantages as a (a.id)}
        <div class="adv">
          <span class="adv-lbl" class:flaw={a.system.kind === "flaw"}>
            <b>{a.name}</b><i>· {prettify(a.system.kind)}</i>
          </span>
          <DotRating
            value={a.system.value}
            max={a.system.maxValue || 5}
            size={10}
            readonly
          />
        </div>
      {/each}
    </section>
  </div>

  <!-- convictions + xp -->
  <div class="foot">
    <section class="panel brd">
      <div class="sect-h">Convictions &amp; Touchstones</div>
      {#if (sys.convictions ?? []).length === 0}
        <p class="empty">No convictions recorded.</p>
      {/if}
      {#each sys.convictions ?? [] as c, i (i)}
        <div class="conv">
          <div class="conv-q">“{c.conviction}”</div>
          <div class="conv-t"><span class="mini-lbl">Touchstone</span>{c.touchstone}</div>
        </div>
      {/each}
    </section>
    <section class="xp">
      <div class="sect-h ink">Experience</div>
      <div class="xp-row"><span class="xp-k">Unspent</span><span class="xp-big">{sys.xp?.value ?? 0}</span></div>
      <div class="xp-row2"><span>Total earned</span><span class="xp-tot">{sys.xp?.total ?? 0}</span></div>
    </section>
  </div>
</div>

<style>
  .gl-vampire {
    width: 960px;
    max-width: 100%;
    margin: 0 auto;
    background: var(--gl-parch);
    color: var(--gl-ink);
    font-family: var(--gl-body);
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
  .triad {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 26px;
    margin-bottom: 30px;
  }
  .col-h {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 10px;
    text-align: center;
    color: var(--gl-muted);
    margin-bottom: 10px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .at-name {
    font-family: var(--gl-semi);
    font-weight: 500;
    font-size: 14px;
  }
  .sk-name {
    font-family: var(--gl-semi);
    font-weight: 500;
    font-size: 13px;
  }
  .sk-name.has-spec {
    color: var(--gl-blood);
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
  .reso-in {
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 16px;
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
    margin-bottom: 14px;
  }
  .disc-h {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
  }
  .disc-name {
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 18px;
  }
  .pw {
    font-size: 12px;
    color: var(--gl-muted-2);
    padding-left: 12px;
    border-left: 2px solid var(--gl-line);
    margin-bottom: 2px;
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
    margin-bottom: 12px;
  }
  .conv-q {
    font-family: var(--gl-serif);
    font-style: italic;
    font-weight: 600;
    font-size: 17px;
  }
  .conv-t {
    font-size: 12px;
    color: var(--gl-muted-2);
    margin-top: 2px;
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
  }
  .xp-row2 {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--gl-muted-2);
    border-top: 1px dotted var(--gl-line-soft);
    padding-top: 7px;
  }
  .xp-tot {
    font-weight: 600;
    color: var(--gl-ink);
  }
</style>
