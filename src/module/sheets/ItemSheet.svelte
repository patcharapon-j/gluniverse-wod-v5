<script lang="ts">
  import { prettify } from "../components/labels.ts";
  import { DISCIPLINES, ADVANTAGE_KINDS } from "../config.ts";
  import DotRating from "../components/DotRating.svelte";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    doc: any;
    snap: any;
    app: any;
  }
  let { doc, snap }: Props = $props();

  const sys = $derived(snap.system);
  const type = $derived(doc.type as string);

  function up(path: string, value: unknown) {
    doc.update({ [path]: value });
  }

  const DAMAGE_TYPES = ["superficial", "aggravated"] as const;
</script>

<div class="gl-item">
  <header class="ihdr">
    <button class="thumbwrap" title="Change image" onclick={() => (doc as any).sheet?._onEditImage?.()} aria-label="Change image">
      <img class="thumb" src={snap.img} alt="" onerror={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")} />
    </button>
    <div class="titles">
      <div class="kind">{prettify(type)}</div>
      <input class="iname" value={snap.name} onchange={(e) => doc.update({ name: e.currentTarget.value })} />
    </div>
  </header>

  <div class="fields">
    {#if type === "discipline"}
      <label class="field wide">
        <span>Discipline</span>
        <select value={sys.discipline} onchange={(e) => up("system.discipline", e.currentTarget.value)}>
          <option value="">—</option>
          {#each DISCIPLINES as d (d)}<option value={d}>{prettify(d)}</option>{/each}
        </select>
      </label>
      <div class="field">
        <span>Rating</span>
        <DotRating value={sys.value} onchange={(n) => up("system.value", n)} />
      </div>
    {/if}

    {#if type === "power"}
      <label class="field wide">
        <span>Discipline</span>
        <select value={sys.discipline} onchange={(e) => up("system.discipline", e.currentTarget.value)}>
          <option value="">—</option>
          {#each DISCIPLINES as d (d)}<option value={d}>{prettify(d)}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span>Level</span>
        <input type="number" min="1" max="5" value={sys.level} onchange={(e) => up("system.level", Number(e.currentTarget.value))} />
      </label>
      <label class="field wide">
        <span>Cost</span>
        <input value={sys.cost} placeholder="e.g. One Rouse Check" onchange={(e) => up("system.cost", e.currentTarget.value)} />
      </label>
      <label class="field wide">
        <span>Dice Pool</span>
        <input value={sys.pool} placeholder="e.g. Charisma + Presence" onchange={(e) => up("system.pool", e.currentTarget.value)} />
      </label>
      <label class="field wide">
        <span>Opposing Pool</span>
        <input value={sys.opposingPool} onchange={(e) => up("system.opposingPool", e.currentTarget.value)} />
      </label>
      <label class="field wide">
        <span>Duration</span>
        <input value={sys.duration} onchange={(e) => up("system.duration", e.currentTarget.value)} />
      </label>
      <label class="field">
        <span>Amalgam Discipline</span>
        <select value={sys.amalgam?.discipline ?? ""} onchange={(e) => up("system.amalgam.discipline", e.currentTarget.value)}>
          <option value="">—</option>
          {#each DISCIPLINES as d (d)}<option value={d}>{prettify(d)}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span>Amalgam Level</span>
        <input type="number" min="0" max="5" value={sys.amalgam?.level ?? 0} onchange={(e) => up("system.amalgam.level", Number(e.currentTarget.value))} />
      </label>
    {/if}

    {#if type === "ritual" || type === "ceremony"}
      <label class="field">
        <span>Level</span>
        <input type="number" min="1" max="5" value={sys.level} onchange={(e) => up("system.level", Number(e.currentTarget.value))} />
      </label>
      <label class="field wide">
        <span>Dice Pool</span>
        <input value={sys.pool} onchange={(e) => up("system.pool", e.currentTarget.value)} />
      </label>
      <label class="field wide">
        <span>Ingredients</span>
        <input value={sys.ingredients} onchange={(e) => up("system.ingredients", e.currentTarget.value)} />
      </label>
    {/if}

    {#if type === "advantage"}
      <label class="field wide">
        <span>Kind</span>
        <select value={sys.kind} onchange={(e) => up("system.kind", e.currentTarget.value)}>
          {#each ADVANTAGE_KINDS as k (k)}<option value={k}>{prettify(k)}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span>Rating</span>
        <input type="number" min="0" max="5" value={sys.value} onchange={(e) => up("system.value", Number(e.currentTarget.value))} />
      </label>
      <label class="field">
        <span>Max</span>
        <input type="number" min="0" max="5" value={sys.maxValue} onchange={(e) => up("system.maxValue", Number(e.currentTarget.value))} />
      </label>
      <label class="field wide">
        <span>Detail</span>
        <input value={sys.detail} placeholder="e.g. prey type, named Discipline" onchange={(e) => up("system.detail", e.currentTarget.value)} />
      </label>
    {/if}

    {#if type === "weapon"}
      <label class="field">
        <span>Damage</span>
        <input type="number" min="0" value={sys.damage} onchange={(e) => up("system.damage", Number(e.currentTarget.value))} />
      </label>
      <label class="field wide">
        <span>Damage Type</span>
        <select value={sys.damageType} onchange={(e) => up("system.damageType", e.currentTarget.value)}>
          {#each DAMAGE_TYPES as d (d)}<option value={d}>{prettify(d)}</option>{/each}
        </select>
      </label>
      <label class="field wide">
        <span>Dice Pool</span>
        <input value={sys.pool} placeholder="e.g. Strength + Brawl" onchange={(e) => up("system.pool", e.currentTarget.value)} />
      </label>
      <label class="field wide">
        <span>Range</span>
        <input value={sys.range} onchange={(e) => up("system.range", e.currentTarget.value)} />
      </label>
      <label class="field wide">
        <span>Concealment</span>
        <input value={sys.concealment} onchange={(e) => up("system.concealment", e.currentTarget.value)} />
      </label>
      <label class="field">
        <span>Quantity</span>
        <input type="number" min="0" value={sys.quantity} onchange={(e) => up("system.quantity", Number(e.currentTarget.value))} />
      </label>
      <label class="field check">
        <input type="checkbox" checked={sys.equipped} onchange={(e) => up("system.equipped", e.currentTarget.checked)} />
        <span>Equipped</span>
      </label>
    {/if}

    {#if type === "armor"}
      <label class="field">
        <span>Rating</span>
        <input type="number" min="0" value={sys.rating} onchange={(e) => up("system.rating", Number(e.currentTarget.value))} />
      </label>
      <label class="field wide">
        <span>Type</span>
        <input value={sys.type} onchange={(e) => up("system.type", e.currentTarget.value)} />
      </label>
      <label class="field">
        <span>Penalty</span>
        <input type="number" value={sys.penalty} onchange={(e) => up("system.penalty", Number(e.currentTarget.value))} />
      </label>
      <label class="field check">
        <input type="checkbox" checked={sys.equipped} onchange={(e) => up("system.equipped", e.currentTarget.checked)} />
        <span>Equipped</span>
      </label>
    {/if}

    {#if type === "gear"}
      <label class="field">
        <span>Quantity</span>
        <input type="number" min="0" value={sys.quantity} onchange={(e) => up("system.quantity", Number(e.currentTarget.value))} />
      </label>
      <label class="field wide">
        <span>Cost</span>
        <input value={sys.cost} onchange={(e) => up("system.cost", e.currentTarget.value)} />
      </label>
      <label class="field check">
        <input type="checkbox" checked={sys.equipped} onchange={(e) => up("system.equipped", e.currentTarget.checked)} />
        <span>Equipped</span>
      </label>
    {/if}

    <label class="field wide">
      <span>Source</span>
      <input value={sys.source} placeholder="Book &amp; page" onchange={(e) => up("system.source", e.currentTarget.value)} />
    </label>
  </div>

  <div class="desc">
    <div class="sect-h">Description</div>
    <textarea
      rows="7"
      value={sys.description}
      onchange={(e) => up("system.description", e.currentTarget.value)}
    ></textarea>
  </div>

  {#if type === "ritual" || type === "ceremony"}
    <div class="desc">
      <div class="sect-h">Process</div>
      <textarea
        rows="5"
        value={sys.process}
        onchange={(e) => up("system.process", e.currentTarget.value)}
      ></textarea>
    </div>
  {/if}
</div>

<style>
  .gl-item {
    padding: 18px 20px;
    background: var(--gl-parch);
    color: var(--gl-ink);
    font-family: var(--gl-body);
    min-height: 100%;
    box-sizing: border-box;
  }
  .ihdr {
    display: flex;
    gap: 14px;
    align-items: center;
    border-bottom: 2px solid var(--gl-ink);
    padding-bottom: 12px;
    position: relative;
  }
  .thumbwrap {
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    line-height: 0;
  }
  .thumb {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border: 1px solid var(--gl-line);
  }
  .kind {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 10px;
    color: var(--gl-blood);
  }
  .iname {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 28px;
    line-height: 1;
    width: 100%;
    border: none;
    background: transparent;
    color: var(--gl-ink);
  }
  .iname:focus {
    outline: none;
    border-bottom: 1px solid var(--gl-blood);
  }
  .fields {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 16px 0;
    align-items: flex-end;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .field > span {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-muted);
  }
  .field input,
  .field select {
    border: 1px solid var(--gl-line);
    background: var(--gl-parch-raise);
    padding: 4px 6px;
    color: var(--gl-ink);
    font-family: inherit;
    width: 100px;
  }
  .field.wide input,
  .field.wide select {
    width: 190px;
  }
  .field.check {
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
  .field.check input {
    width: auto;
  }
  .field.check span {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 10px;
    color: var(--gl-muted);
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
    margin-bottom: 10px;
  }
  .desc {
    margin-top: 14px;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--gl-line);
    background: var(--gl-parch-raise);
    color: var(--gl-ink);
    font-family: var(--gl-body);
    padding: 8px;
    resize: vertical;
  }
</style>
