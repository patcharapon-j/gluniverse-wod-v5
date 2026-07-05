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

  // Permission gates (see VampireSheet for the mechanism).
  const editable = $derived(snap.editable as boolean);
  const limited = $derived(snap.limited as boolean);

  let editMode = $state(false);
  let dragOver = $state(false);
  const edit = $derived(editMode && editable);

  function up(path: string, value: unknown) {
    if (!editable) return;
    doc.update({ [path]: value });
  }

  const delMember = (i: number) =>
    up("system.members", (sys.members ?? []).filter((_: string, idx: number) => idx !== i));

  /** Resolve a stored member entry (UUID or bare actor id) to its Actor, if any. */
  function resolveMember(ref: string): any {
    if (!ref) return null;
    try {
      const byUuid = fromUuidSync(ref);
      if (byUuid) return byUuid;
    } catch {
      /* not a uuid — fall through to id lookup */
    }
    return game.actors?.get(ref) ?? null;
  }

  const members = $derived(
    (sys.members ?? []).map((ref: string, i: number) => ({ ref, i, actor: resolveMember(ref) })),
  );

  function openMember(actor: any): void {
    if (!actor?.visible && !actor?.isOwner) return;
    actor.sheet?.render(true);
  }

  function readDragActorUuid(event: DragEvent): string | null {
    try {
      const data = JSON.parse(event.dataTransfer?.getData("text/plain") ?? "{}");
      if (data?.type === "Actor" && data.uuid) return data.uuid as string;
    } catch {
      /* ignore malformed drag payloads */
    }
    return null;
  }

  function onMemberDrop(event: DragEvent): void {
    event.preventDefault();
    dragOver = false;
    if (!editable) return;
    const uuid = readDragActorUuid(event);
    if (!uuid) return;
    const existing: string[] = sys.members ?? [];
    if (existing.includes(uuid)) return;
    up("system.members", [...existing, uuid]);
  }

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
  {#if limited}
    <header class="hdr">
      <div class="spine"></div>
      <div class="eyebrow">Coterie · Shared Domain</div>
      <div class="name">{snap.name}</div>
      {#if sys.coterieType}<div class="ctype">{sys.coterieType}</div>{/if}
    </header>
  {:else}
  <header class="hdr">
    <div class="spine"></div>
    <div class="eyebrow">Coterie · Shared Domain</div>
    <input class="name" value={snap.name} disabled={!editable} onchange={(e) => editable && doc.update({ name: e.currentTarget.value })} />
    <input class="ctype" placeholder="Coterie type (e.g. Blood Cult, Cell)…" value={sys.coterieType} disabled={!editable} onchange={(e) => up("system.coterieType", e.currentTarget.value)} />
  </header>

  <section class="domain">
    <div class="sect-h">Domain</div>
    <div class="dom-grid">
      {#each DOMAIN as [key, lbl, desc] (key)}
        <div class="dom">
          <div class="dom-h">{lbl}</div>
          <DotRating value={sys.domain?.[key] ?? 0} max={5} size={16} color="blood" readonly={!editable} onchange={(n) => up(`system.domain.${key}`, n)} />
          <div class="dom-desc">{desc}</div>
        </div>
      {/each}
    </div>
  </section>

  <div class="cols">
    <section
      class="panel brd members-panel"
      class:dragover={dragOver}
      role="group"
      aria-label="Coterie members"
      ondragover={(e) => (e.preventDefault(), (dragOver = true))}
      ondragleave={() => (dragOver = false)}
      ondrop={onMemberDrop}
    >
      <div class="sect-h with-add">
        Members
        {#if editable}
          <button class="mode-toggle" class:on={editMode} onclick={() => (editMode = !editMode)} title="Toggle edit mode">
            {editMode ? "🔓 Edit" : "🔒 Play"}
          </button>
        {/if}
      </div>
      {#if members.length === 0}<p class="empty">{#if editable}Drag an actor here to add a member.{:else}No members.{/if}</p>{/if}
      {#each members as { ref, i, actor } (i)}
        <div class="row gl-row">
          {#if actor}
            <button class="member-card" onclick={() => openMember(actor)} title="Open {actor.name}'s sheet">
              <img class="member-thumb" src={actor.img} alt={actor.name} />
              <span class="member-name">{actor.name}</span>
            </button>
          {:else}
            <div class="member-card missing">
              <span class="member-thumb missing-thumb">?</span>
              <span class="member-name muted">Missing actor ({ref || "unknown"})</span>
            </div>
          {/if}
          {#if edit}<button class="del" onclick={() => delMember(i)} aria-label="Remove">✕</button>{/if}
        </div>
      {/each}
      {#if members.length && editable}<p class="hint">Drag another actor here to add them.</p>{/if}
    </section>

    <section class="panel">
      <div class="sect-h with-add">
        Shared Backgrounds
        {#if editable}<button class="add-btn" onclick={addBg}>+ Add</button>{/if}
      </div>
      {#if (sys.backgrounds ?? []).length === 0}<p class="empty">Havens, contacts, resources…</p>{/if}
      {#each sys.backgrounds ?? [] as b, i (i)}
        <div class="bg gl-row">
          <div class="bg-top">
            <input class="bg-name" value={b.name} disabled={!editable} onchange={(e) => editBg(i, "name", e.currentTarget.value)} />
            <DotRating value={b.value} max={5} size={11} readonly={!editable} onchange={(n) => editBg(i, "value", n)} />
            {#if editable}<button class="del" onclick={() => delBg(i)} aria-label="Remove">✕</button>{/if}
          </div>
          <input class="bg-note" placeholder="Note…" value={b.note} disabled={!editable} onchange={(e) => editBg(i, "note", e.currentTarget.value)} />
        </div>
      {/each}
    </section>
  </div>

  <div class="foot">
    <div class="sect-h">Notes</div>
    {#if editable}
      <textarea rows="5" value={sys.notes} onchange={(e) => up("system.notes", e.currentTarget.value)}></textarea>
    {:else if sys.notes}
      <div class="notes-ro">{sys.notes}</div>
    {:else}
      <p class="empty">No notes.</p>
    {/if}
  </div>
  {/if}
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
  .members-panel {
    position: relative;
  }
  .members-panel.dragover::after {
    content: "Drop to add member";
    position: absolute;
    inset: 10px;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 13px;
    color: var(--gl-blood);
    background: color-mix(in srgb, var(--gl-parch) 78%, transparent);
    border: 2px dashed var(--gl-blood);
    pointer-events: none;
  }
  .mode-toggle {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 10px;
    color: var(--gl-muted-2);
    background: transparent;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    padding: 2px 8px;
    cursor: pointer;
  }
  .mode-toggle:hover {
    border-color: var(--gl-blood);
    color: var(--gl-blood);
  }
  .mode-toggle.on {
    color: var(--gl-ink);
    background: var(--gl-gold);
    border-color: var(--gl-ink);
    font-weight: 600;
  }
  .member-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    background: transparent;
    border: none;
    padding: 3px 0;
    text-align: left;
    cursor: pointer;
    color: inherit;
    font: inherit;
  }
  .member-card:hover .member-name {
    color: var(--gl-blood);
  }
  .member-card.missing {
    cursor: default;
  }
  .member-thumb {
    width: 28px;
    height: 28px;
    flex: none;
    object-fit: cover;
    border-radius: 3px;
    border: 1px solid var(--gl-line);
    background: var(--gl-parch-raise);
  }
  .missing-thumb {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--gl-muted);
    font-family: var(--gl-serif);
    font-weight: 700;
  }
  .member-name {
    flex: 1;
    font-size: 14px;
    border-bottom: 1px solid var(--gl-line);
    padding-bottom: 2px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .member-name.muted {
    color: var(--gl-muted);
    font-style: italic;
  }
  .hint {
    font-size: 11px;
    color: var(--gl-muted);
    font-style: italic;
    margin: 10px 0 0;
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
  .notes-ro {
    font-size: 13px;
    line-height: 1.6;
    color: var(--gl-ink);
    white-space: pre-wrap;
  }
</style>
