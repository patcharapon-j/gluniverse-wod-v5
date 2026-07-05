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

</script>

<div class="track">
  {#each states as s, i (i)}
    <span
      class="box"
      class:sup={s === "s"}
      class:agg={s === "a"}
      role="button"
      tabindex="0"
      aria-label={`Damage box ${i + 1}`}
      onclick={() => cycle(i)}
      onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), cycle(i))}
    ></span>
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
    display: inline-block;
    position: relative;
    background: transparent;
    box-sizing: border-box;
    user-select: none;
    transition: background 0.18s ease, border-color 0.12s ease;
  }
  /* Damage strokes span the whole box, matching the Humanity stain cross:
     one diagonal for superficial, two crossed for aggravated. Both strokes are
     always present but collapsed, so marking damage draws them in like a knife
     stroke; the aggravated cross-stroke lands a beat after the first. */
  .box::before,
  .box::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 130%;
    background: var(--gl-blood-bright);
    transition: transform 0.18s ease-out;
  }
  .box::before {
    transform: translate(-50%, -50%) rotate(45deg) scaleY(0);
  }
  .box::after {
    transform: translate(-50%, -50%) rotate(-45deg) scaleY(0);
  }
  .box.sup::before,
  .box.agg::before {
    transform: translate(-50%, -50%) rotate(45deg) scaleY(1);
  }
  .box.agg::after {
    transform: translate(-50%, -50%) rotate(-45deg) scaleY(1);
    transition-delay: 0.07s;
  }
  .box.agg {
    background: var(--gl-track-agg, #e3d3bd);
  }
  .box:hover {
    border-color: var(--gl-blood);
  }
  .box:focus-visible {
    outline: 2px solid var(--gl-blood);
    outline-offset: 1px;
  }
</style>
