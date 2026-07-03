<script lang="ts">
  /* Active Effects list for a document, with add / toggle / edit / delete. */
  import ItemControls from "./ItemControls.svelte";
  import { createEffect, editEffect, deleteEffect, toggleEffect } from "../apps/effects.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    doc: any;
    snap: any;
  }
  let { doc, snap }: Props = $props();

  const effects = $derived(snap.effects ?? []);
</script>

<section class="gl-effects">
  <div class="sect-h with-add">
    Active Effects
    <button class="add-btn" onclick={() => createEffect(doc)}>+ Add</button>
  </div>

  {#if effects.length === 0}
    <p class="empty">No active effects. Add one to modify traits, tracks, or pools.</p>
  {/if}

  {#each effects as fx (fx.id)}
    <div class="fx gl-row" class:off={fx.disabled}>
      <button
        class="toggle"
        title={fx.disabled ? "Enable" : "Disable"}
        aria-label={fx.disabled ? "Enable" : "Disable"}
        onclick={() => toggleEffect(doc, fx.id)}
      >
        <img src={fx.img} alt="" />
      </button>
      <button class="fx-name" onclick={() => editEffect(doc, fx.id)}>{fx.name}</button>
      <span class="count" title="Number of changes">{fx.changes.length}</span>
      <ItemControls onedit={() => editEffect(doc, fx.id)} ondelete={() => deleteEffect(doc, fx.id)} />
    </div>
  {/each}
</section>

<style>
  .gl-effects {
    padding: 4px 0;
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
  .empty {
    font-size: 12px;
    color: var(--gl-muted);
    font-style: italic;
    margin: 0 0 8px;
  }
  .fx {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 4px 0;
    border-bottom: 1px dotted var(--gl-line-soft);
  }
  .fx.off {
    opacity: 0.5;
  }
  .toggle {
    flex: none;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 1px solid var(--gl-line);
    border-radius: 4px;
    background: var(--gl-parch-raise);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .toggle:hover {
    border-color: var(--gl-blood);
  }
  .fx.off .toggle {
    filter: grayscale(1);
  }
  .toggle img {
    width: 18px;
    height: 18px;
    border: none;
  }
  .fx-name {
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
  .fx.off .fx-name {
    text-decoration: line-through;
  }
  .fx-name:hover {
    color: var(--gl-blood);
  }
  .count {
    font-family: var(--gl-cond);
    font-size: 11px;
    color: var(--gl-muted);
    min-width: 16px;
    text-align: center;
  }
</style>
