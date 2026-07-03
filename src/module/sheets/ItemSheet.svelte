<script lang="ts">
  import { prettify } from "../components/labels.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    doc: any;
    state: any;
    app: any;
  }
  let { doc, state }: Props = $props();

  const sys = $derived(state.system);
  const type = $derived(doc.type as string);

  function up(path: string, value: unknown) {
    doc.update({ [path]: value });
  }

  // Which numeric/string fields to surface per item type.
  const numberFields: Record<string, [string, string][]> = {
    discipline: [["value", "Rating"]],
    power: [["level", "Level"]],
    ritual: [["level", "Level"]],
    ceremony: [["level", "Level"]],
    advantage: [["value", "Rating"], ["maxValue", "Max"]],
    weapon: [["damage", "Damage"], ["quantity", "Quantity"]],
    armor: [["rating", "Rating"], ["penalty", "Penalty"]],
    gear: [["quantity", "Quantity"]],
  };
  const textFields: Record<string, [string, string][]> = {
    power: [["cost", "Cost"], ["pool", "Dice Pool"], ["duration", "Duration"]],
    ritual: [["ingredients", "Ingredients"], ["pool", "Dice Pool"]],
    ceremony: [["ingredients", "Ingredients"], ["pool", "Dice Pool"]],
    weapon: [["damageType", "Damage Type"], ["range", "Range"]],
    armor: [["type", "Type"]],
    gear: [["cost", "Cost"]],
  };
</script>

<div class="gl-item">
  <header class="ihdr">
    <img class="thumb" src={state.img} alt="" onerror={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")} />
    <div class="titles">
      <div class="kind">{prettify(type)}</div>
      <input class="iname" value={state.name} onchange={(e) => doc.update({ name: e.currentTarget.value })} />
    </div>
  </header>

  <div class="fields">
    {#each numberFields[type] ?? [] as [key, lbl] (key)}
      <label class="field">
        <span>{lbl}</span>
        <input type="number" value={sys[key]} onchange={(e) => up(`system.${key}`, Number(e.currentTarget.value))} />
      </label>
    {/each}
    {#each textFields[type] ?? [] as [key, lbl] (key)}
      <label class="field wide">
        <span>{lbl}</span>
        <input value={sys[key]} onchange={(e) => up(`system.${key}`, e.currentTarget.value)} />
      </label>
    {/each}
  </div>

  <div class="desc">
    <div class="sect-h">Description</div>
    <textarea
      rows="8"
      value={sys.description}
      onchange={(e) => up("system.description", e.currentTarget.value)}
    ></textarea>
  </div>
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
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .field span {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-muted);
  }
  .field input {
    border: 1px solid var(--gl-line);
    background: var(--gl-parch-raise);
    padding: 4px 6px;
    color: var(--gl-ink);
    font-family: inherit;
    width: 90px;
  }
  .field.wide input {
    width: 180px;
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
