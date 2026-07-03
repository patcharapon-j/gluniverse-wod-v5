<script lang="ts">
  interface Props {
    superficial?: number;
    aggravated?: number;
    max?: number;
    onchange?: (v: { superficial: number; aggravated: number }) => void;
  }
  let { superficial = 0, aggravated = 0, max = 0, onchange }: Props = $props();

  // Box states: aggravated (✕) fill first, then superficial (/), then empty.
  const states = $derived(
    Array.from({ length: max }, (_, i) =>
      i < aggravated ? "a" : i < aggravated + superficial ? "s" : "e",
    ),
  );

  function cycle(i: number) {
    const cur = states[i];
    const next = cur === "e" ? "s" : cur === "s" ? "a" : "e";
    const arr = [...states];
    arr[i] = next;
    onchange?.({
      superficial: arr.filter((x) => x === "s").length,
      aggravated: arr.filter((x) => x === "a").length,
    });
  }

  const symbol = (s: string) => (s === "a" ? "✕" : s === "s" ? "/" : "");
</script>

<div class="track">
  {#each states as s, i (i)}
    <span
      class="box"
      class:agg={s === "a"}
      role="button"
      tabindex="0"
      aria-label={`Damage box ${i + 1}`}
      onclick={() => cycle(i)}
      onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), cycle(i))}
      >{symbol(s)}</span
    >
  {/each}
</div>

<style>
  .track {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .box {
    width: var(--gl-box);
    height: var(--gl-box);
    border: 1.5px solid var(--gl-ink);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--gl-body);
    font-weight: 600;
    font-size: 15px;
    color: var(--gl-blood);
    background: transparent;
    box-sizing: border-box;
    user-select: none;
  }
  .box.agg {
    background: #e3d3bd;
  }
  .box:hover {
    filter: brightness(0.96);
  }
  .box:focus-visible {
    outline: 2px solid var(--gl-blood);
    outline-offset: 1px;
  }
</style>
