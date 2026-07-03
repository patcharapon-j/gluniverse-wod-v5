<script lang="ts">
  import { ATTRIBUTES } from "../config.ts";
  import { label, prettify } from "./labels.ts";
  import DotRating from "./DotRating.svelte";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    attributes: any;
    onrate: (key: string, n: number) => void;
    onroll?: (key: string) => void;
  }
  let { attributes, onrate, onroll }: Props = $props();
</script>

<div class="triad">
  {#each Object.entries(ATTRIBUTES) as [cat, keys] (cat)}
    <div class="col">
      <div class="col-h">{prettify(cat)}</div>
      {#each keys as k (k)}
        <div class="row">
          {#if onroll}
            <button class="at-name roll-trait" title="Roll {label('Attributes', k)}" onclick={() => onroll?.(k)}>{label("Attributes", k)}</button>
          {:else}
            <span class="at-name">{label("Attributes", k)}</span>
          {/if}
          <DotRating value={attributes[k].value} onchange={(n) => onrate(k, n)} />
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
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
  .roll-trait {
    background: transparent;
    border: none;
    padding: 0;
    color: var(--gl-ink);
    cursor: pointer;
    text-align: left;
    border-bottom: 1px solid transparent;
  }
  .roll-trait:hover {
    color: var(--gl-blood);
    border-bottom-color: var(--gl-blood);
  }
</style>
