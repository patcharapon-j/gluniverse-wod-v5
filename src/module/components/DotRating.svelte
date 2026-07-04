<script lang="ts">
  import { dotToggle } from "../apps/util.ts";

  interface Props {
    value?: number;
    max?: number;
    size?: number;
    color?: "ink" | "blood";
    readonly?: boolean;
    onchange?: (n: number) => void;
  }
  let { value = 0, max = 5, size = 14, color = "ink", readonly = false, onchange }: Props = $props();

  const cells = $derived(Array.from({ length: max }, (_, i) => i));

  function click(i: number) {
    if (readonly) return;
    onchange?.(dotToggle(value, i));
  }
</script>

<span class="dots" class:blood={color === "blood"}>
  {#each cells as i (i)}
    <span
      class="dot"
      class:on={i < value}
      class:readonly
      style="--sz:{size}px"
      role="button"
      tabindex={readonly ? -1 : 0}
      aria-label={`Set rating ${i + 1}`}
      onclick={() => click(i)}
      onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), click(i))}
    ></span>
  {/each}
</span>

<style>
  .dots {
    display: inline-flex;
    gap: 4px;
    flex: none;
  }
  .dot {
    width: var(--sz);
    height: var(--sz);
    border-radius: 50%;
    border: 1.5px solid var(--gl-ink);
    background: transparent;
    cursor: pointer;
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    transition: transform 0.12s ease, border-color 0.12s ease;
  }
  .dots.blood .dot {
    border-color: var(--gl-blood);
  }
  .dot.readonly {
    cursor: default;
  }
  /* The fill is always present and scales in/out, so rating changes read as a
     small bloom instead of an instant repaint. */
  .dot::after {
    content: "";
    position: absolute;
    inset: 2px;
    border-radius: 50%;
    background: var(--gl-ink);
    transform: scale(0);
    opacity: 0;
    transition: transform 0.16s cubic-bezier(0.2, 0.8, 0.3, 1.2), opacity 0.12s ease;
  }
  .dot.on::after {
    transform: scale(1);
    opacity: 1;
  }
  .dots.blood .dot::after {
    background: var(--gl-blood);
  }
  .dot:not(.readonly):hover {
    transform: scale(1.15);
    border-color: var(--gl-blood);
  }
  .dot:focus-visible {
    outline: 2px solid var(--gl-blood);
    outline-offset: 1px;
  }
</style>
