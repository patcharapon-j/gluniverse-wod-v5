<script lang="ts">
  import DotRating from "../components/DotRating.svelte";
  import { rollPool } from "../dice/roll-v5.ts";
  import { postRollCard } from "../dice/chat.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    doc: any;
    snap: any;
    app: any;
  }
  let { doc, snap }: Props = $props();

  const sys = $derived(snap.system);

  function up(path: string, value: unknown) {
    doc.update({ [path]: value });
  }

  // Roll a flat pool (SPC blocks quote a single dice number, not attr + skill).
  async function rollFlat(pool: number, flavor: string) {
    const p = Math.max(0, pool);
    if (p === 0) return;
    const { result, roll } = await rollPool({ pool: p, hunger: sys.hunger ?? 0, difficulty: 1 });
    await postRollCard(doc, result, roll, { flavor });
  }

  // --- editable arrays ------------------------------------------------------
  function addPool() {
    up("system.standardPools", [...(sys.standardPools ?? []), { label: "New Pool", value: 4 }]);
  }
  function editPool(i: number, field: "label" | "value", value: unknown) {
    up(
      "system.standardPools",
      (sys.standardPools ?? []).map((p: any, idx: number) => (idx === i ? { ...p, [field]: value } : p)),
    );
  }
  const delPool = (i: number) =>
    up("system.standardPools", (sys.standardPools ?? []).filter((_: any, idx: number) => idx !== i));

  function addDisc() {
    up("system.disciplines", [...(sys.disciplines ?? []), { name: "New Discipline", value: 1 }]);
  }
  function editDisc(i: number, field: "name" | "value", value: unknown) {
    up(
      "system.disciplines",
      (sys.disciplines ?? []).map((d: any, idx: number) => (idx === i ? { ...d, [field]: value } : d)),
    );
  }
  const delDisc = (i: number) =>
    up("system.disciplines", (sys.disciplines ?? []).filter((_: any, idx: number) => idx !== i));

  const POOLS = [
    ["physical", "Physical"],
    ["social", "Social"],
    ["mental", "Mental"],
  ] as const;
</script>

<div class="gl-spc">
  <header class="hdr">
    <div class="spine"></div>
    <div class="eyebrow">Antagonist · Storyteller Character</div>
    <input class="name" value={snap.name} onchange={(e) => doc.update({ name: e.currentTarget.value })} />
    <input class="archetype" placeholder="Archetype / concept…" value={sys.archetype} onchange={(e) => up("system.archetype", e.currentTarget.value)} />
  </header>

  <div class="grid">
    <section class="block">
      <div class="sect-h">Attribute Pools</div>
      {#each POOLS as [key, lbl] (key)}
        <div class="pool-row">
          <button class="pool-name" title="Roll {lbl}" onclick={() => rollFlat(sys.attributePools?.[key] ?? 0, lbl)}>{lbl}</button>
          <input class="num" type="number" min="0" value={sys.attributePools?.[key] ?? 0} onchange={(e) => up(`system.attributePools.${key}`, Number(e.currentTarget.value))} />
        </div>
      {/each}

      <div class="sect-h with-add">
        Standard Pools
        <button class="add-btn" onclick={addPool}>+ Add</button>
      </div>
      {#if (sys.standardPools ?? []).length === 0}<p class="empty">Add named pools (e.g. Mesmerize 7).</p>{/if}
      {#each sys.standardPools ?? [] as p, i (i)}
        <div class="pool-row gl-row">
          <button class="pool-roll" title="Roll {p.label}" onclick={() => rollFlat(p.value, p.label)} aria-label="Roll">⚄</button>
          <input class="pool-lbl" value={p.label} onchange={(e) => editPool(i, "label", e.currentTarget.value)} />
          <input class="num" type="number" min="0" value={p.value} onchange={(e) => editPool(i, "value", Number(e.currentTarget.value))} />
          <button class="del" onclick={() => delPool(i)} aria-label="Remove">✕</button>
        </div>
      {/each}
    </section>

    <aside class="stats">
      <div class="sect-h">Vitals</div>
      {#each [["health", "Health"], ["willpower", "Willpower"], ["humanity", "Humanity"], ["hunger", "Hunger"]] as const as [key, lbl] (key)}
        <label class="stat">
          <span>{lbl}</span>
          <input type="number" min="0" value={sys[key]} onchange={(e) => up(`system.${key}`, Number(e.currentTarget.value))} />
        </label>
      {/each}

      <div class="sect-h with-add">
        Disciplines
        <button class="add-btn" onclick={addDisc}>+ Add</button>
      </div>
      {#if (sys.disciplines ?? []).length === 0}<p class="empty">None.</p>{/if}
      {#each sys.disciplines ?? [] as d, i (i)}
        <div class="disc-row gl-row">
          <input class="disc-name" value={d.name} onchange={(e) => editDisc(i, "name", e.currentTarget.value)} />
          <DotRating value={d.value} max={5} size={10} onchange={(n) => editDisc(i, "value", n)} />
          <button class="del" onclick={() => delDisc(i)} aria-label="Remove">✕</button>
        </div>
      {/each}
    </aside>
  </div>

  <div class="foot">
    <div class="sect-h">Notes</div>
    <textarea rows="5" value={sys.notes} onchange={(e) => up("system.notes", e.currentTarget.value)}></textarea>
  </div>
</div>

<style>
  .gl-spc {
    width: 720px;
    max-width: 100%;
    margin: 0 auto;
    background: var(--gl-parch);
    color: var(--gl-ink);
    font-family: var(--gl-body);
  }
  input,
  textarea {
    font-family: inherit;
    color: var(--gl-ink);
    background: transparent;
    border: none;
  }
  input:focus,
  textarea:focus {
    outline: none;
  }
  .hdr {
    padding: 22px 30px 16px;
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
  .eyebrow {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 5px;
    font-size: 10px;
    color: var(--gl-blood);
  }
  .name {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 36px;
    line-height: 1;
    margin-top: 2px;
    width: 100%;
  }
  .archetype {
    font-family: var(--gl-serif);
    font-style: italic;
    font-size: 15px;
    color: var(--gl-muted-2);
    width: 100%;
    margin-top: 2px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 260px;
  }
  .block {
    padding: 22px 26px;
    border-right: 1px solid var(--gl-line);
  }
  .stats {
    padding: 22px 22px;
    background: var(--gl-parch-raise);
  }
  .sect-h {
    font-family: var(--gl-cond);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 4px;
    font-size: 12px;
    color: var(--gl-blood);
    border-bottom: 1px solid var(--gl-ink);
    padding-bottom: 4px;
    margin: 0 0 12px;
  }
  .sect-h.with-add {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 22px;
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
  .pool-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .pool-name {
    flex: 1;
    text-align: left;
    font-family: var(--gl-semi);
    font-weight: 600;
    font-size: 14px;
    background: transparent;
    border: none;
    color: var(--gl-ink);
    cursor: pointer;
  }
  .pool-name:hover {
    color: var(--gl-blood);
  }
  .pool-roll {
    background: transparent;
    border: none;
    color: var(--gl-blood);
    cursor: pointer;
    font-size: 15px;
    padding: 0;
  }
  .pool-lbl {
    flex: 1;
    border-bottom: 1px solid var(--gl-line);
  }
  .num {
    width: 46px;
    text-align: center;
    border: 1px solid var(--gl-line);
    background: var(--gl-parch-raise);
    padding: 3px;
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 16px;
  }
  .del {
    background: transparent;
    border: none;
    color: var(--gl-muted);
    cursor: pointer;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.12s;
  }
  .gl-row:hover .del {
    opacity: 1;
  }
  .del:hover {
    color: var(--gl-blood-bright);
  }
  .stat {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 7px;
  }
  .stat span {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 11px;
    color: var(--gl-muted-2);
  }
  .disc-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .disc-name {
    flex: 1;
    border-bottom: 1px solid var(--gl-line);
    font-size: 13px;
  }
  .empty {
    font-size: 12px;
    color: var(--gl-muted);
    font-style: italic;
    margin: 0 0 8px;
  }
  .foot {
    padding: 20px 26px;
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
</style>
