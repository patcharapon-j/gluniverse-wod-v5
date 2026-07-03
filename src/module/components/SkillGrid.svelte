<script lang="ts">
  import { SKILLS } from "../config.ts";
  import { label, prettify } from "./labels.ts";
  import DotRating from "./DotRating.svelte";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    skills: any;
    onrate: (key: string, n: number) => void;
    onspec: (key: string, list: string[]) => void;
    onroll?: (key: string) => void;
  }
  let { skills, onrate, onspec, onroll }: Props = $props();

  let editing: string | null = $state(null);

  const specText = (k: string) => (skills[k].specialties ?? []).join(", ");
  function save(k: string, raw: string) {
    onspec(k, raw.split(",").map((s) => s.trim()).filter(Boolean));
    editing = null;
  }
</script>

<div class="triad">
  {#each Object.entries(SKILLS) as [cat, keys] (cat)}
    <div class="col">
      <div class="col-h">{prettify(cat)}</div>
      {#each keys as k (k)}
        {@const spec = specText(k)}
        <div class="sk-block gl-hoverable">
          <div class="row">
            <span class="sk-left">
              {#if onroll}
                <button class="sk-name roll-trait" class:has-spec={spec} title="Roll {label('Skills', k)}" onclick={() => onroll?.(k)}>{label("Skills", k)}</button>
              {:else}
                <span class="sk-name" class:has-spec={spec}>{label("Skills", k)}</span>
              {/if}
              <button class="spec-edit" title="Edit specialties" aria-label="Edit specialties" onclick={() => (editing = editing === k ? null : k)}>✎</button>
            </span>
            <DotRating value={skills[k].value} size={11} onchange={(n) => onrate(k, n)} />
          </div>
          {#if editing === k}
            <input
              class="spec-in"
              placeholder="Specialties, comma separated"
              value={spec}
              onchange={(e) => save(k, e.currentTarget.value)}
              onkeydown={(e) => e.key === "Enter" && save(k, e.currentTarget.value)}
            />
          {:else if spec}
            <div class="spec-note">{spec}</div>
          {/if}
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
  }
  .sk-block {
    margin-bottom: 6px;
  }
  .sk-block .row {
    margin-bottom: 2px;
  }
  .sk-left {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .sk-name {
    font-family: var(--gl-semi);
    font-weight: 500;
    font-size: 13px;
  }
  .sk-name.has-spec {
    color: var(--gl-blood);
  }
  .roll-trait {
    background: transparent;
    border: none;
    padding: 0;
    color: var(--gl-ink);
    cursor: pointer;
    text-align: left;
  }
  .roll-trait.has-spec {
    color: var(--gl-blood);
  }
  .roll-trait:hover {
    color: var(--gl-blood);
  }
  .spec-edit {
    background: transparent;
    border: none;
    color: var(--gl-muted);
    cursor: pointer;
    font-size: 11px;
    padding: 0 2px;
    opacity: 0;
    transition: opacity 0.12s;
  }
  .gl-hoverable:hover .spec-edit,
  .spec-edit:focus-visible {
    opacity: 1;
  }
  .spec-edit:hover {
    color: var(--gl-blood);
  }
  .spec-in {
    width: 100%;
    font-size: 11px;
    border: 1px solid var(--gl-line);
    background: var(--gl-parch-raise);
    padding: 2px 5px;
    margin-top: 2px;
    color: var(--gl-ink);
    font-family: inherit;
  }
  .spec-note {
    font-size: 10px;
    color: var(--gl-muted-2);
    font-style: italic;
    padding-left: 2px;
  }
</style>
