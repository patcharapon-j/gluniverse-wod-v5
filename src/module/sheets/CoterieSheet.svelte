<script lang="ts">
  import DotRating from "../components/DotRating.svelte";

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

  const addMember = () => up("system.members", [...(sys.members ?? []), ""]);
  const editMember = (i: number, v: string) =>
    up("system.members", (sys.members ?? []).map((m: string, idx: number) => (idx === i ? v : m)));
  const delMember = (i: number) =>
    up("system.members", (sys.members ?? []).filter((_: string, idx: number) => idx !== i));

  const addBg = () => up("system.backgrounds", [...(sys.backgrounds ?? []), { name: "New Background", value: 1, note: "" }]);
  function editBg(i: number, field: "name" | "value" | "note", value: unknown) {
    up(
      "system.backgrounds",
      (sys.backgrounds ?? []).map((b: any, idx: number) => (idx === i ? { ...b, [field]: value } : b)),
    );
  }
  const delBg = (i: number) =>
    up("system.backgrounds", (sys.backgrounds ?? []).filter((_: any, idx: number) => idx !== i));

  const DOMAIN = [
    ["chasse", "Chasse", "The feeding ground"],
    ["lien", "Lien", "Ties to the mortal populace"],
    ["portillon", "Portillon", "Security & escape routes"],
  ] as const;
</script>

<div class="gl-coterie">
  <header class="hdr">
    <div class="spine"></div>
    <div class="eyebrow">Coterie · Shared Domain</div>
    <input class="name" value={snap.name} onchange={(e) => doc.update({ name: e.currentTarget.value })} />
    <input class="ctype" placeholder="Coterie type (e.g. Blood Cult, Cell)…" value={sys.coterieType} onchange={(e) => up("system.coterieType", e.currentTarget.value)} />
  </header>

  <section class="domain">
    <div class="sect-h">Domain</div>
    <div class="dom-grid">
      {#each DOMAIN as [key, lbl, desc] (key)}
        <div class="dom">
          <div class="dom-h">{lbl}</div>
          <DotRating value={sys.domain?.[key] ?? 0} max={5} size={16} color="blood" onchange={(n) => up(`system.domain.${key}`, n)} />
          <div class="dom-desc">{desc}</div>
        </div>
      {/each}
    </div>
  </section>

  <div class="cols">
    <section class="panel brd">
      <div class="sect-h with-add">
        Members
        <button class="add-btn" onclick={addMember}>+ Add</button>
      </div>
      {#if (sys.members ?? []).length === 0}<p class="empty">No members listed.</p>{/if}
      {#each sys.members ?? [] as m, i (i)}
        <div class="row gl-row">
          <input class="member" placeholder="Character name…" value={m} onchange={(e) => editMember(i, e.currentTarget.value)} />
          <button class="del" onclick={() => delMember(i)} aria-label="Remove">✕</button>
        </div>
      {/each}
    </section>

    <section class="panel">
      <div class="sect-h with-add">
        Shared Backgrounds
        <button class="add-btn" onclick={addBg}>+ Add</button>
      </div>
      {#if (sys.backgrounds ?? []).length === 0}<p class="empty">Havens, contacts, resources…</p>{/if}
      {#each sys.backgrounds ?? [] as b, i (i)}
        <div class="bg gl-row">
          <div class="bg-top">
            <input class="bg-name" value={b.name} onchange={(e) => editBg(i, "name", e.currentTarget.value)} />
            <DotRating value={b.value} max={5} size={11} onchange={(n) => editBg(i, "value", n)} />
            <button class="del" onclick={() => delBg(i)} aria-label="Remove">✕</button>
          </div>
          <input class="bg-note" placeholder="Note…" value={b.note} onchange={(e) => editBg(i, "note", e.currentTarget.value)} />
        </div>
      {/each}
    </section>
  </div>

  <div class="foot">
    <div class="sect-h">Notes</div>
    <textarea rows="5" value={sys.notes} onchange={(e) => up("system.notes", e.currentTarget.value)}></textarea>
  </div>
</div>

<style>
  .gl-coterie {
    width: 760px;
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
  .ctype {
    font-family: var(--gl-serif);
    font-style: italic;
    font-size: 15px;
    color: var(--gl-muted-2);
    width: 100%;
    margin-top: 2px;
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
    margin: 0 0 14px;
  }
  .sect-h.with-add {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
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
  .domain {
    padding: 22px 30px;
    border-bottom: 1px solid var(--gl-line);
  }
  .dom-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
  }
  .dom {
    text-align: center;
  }
  .dom-h {
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 20px;
    margin-bottom: 8px;
  }
  .dom :global(.dots) {
    justify-content: center;
  }
  .dom-desc {
    font-size: 11px;
    color: var(--gl-muted);
    margin-top: 8px;
    font-style: italic;
  }
  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .panel {
    padding: 22px 26px;
  }
  .panel.brd {
    border-right: 1px solid var(--gl-line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .member {
    flex: 1;
    border-bottom: 1px solid var(--gl-line);
    font-size: 14px;
    padding: 2px 0;
  }
  .bg {
    margin-bottom: 12px;
  }
  .bg-top {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .bg-name {
    flex: 1;
    font-family: var(--gl-semi);
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid var(--gl-line);
  }
  .bg-note {
    width: 100%;
    font-size: 12px;
    color: var(--gl-muted-2);
    border-bottom: 1px dotted var(--gl-line-soft);
    margin-top: 3px;
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
  .empty {
    font-size: 12px;
    color: var(--gl-muted);
    font-style: italic;
    margin: 0 0 8px;
  }
  .foot {
    padding: 20px 30px;
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
