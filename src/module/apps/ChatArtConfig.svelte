<script lang="ts">
  import type { ChatArtTransform } from "../dice/chat-art.ts";

  interface Props {
    actor: any;
    initial: ChatArtTransform;
    onsave: (value: ChatArtTransform) => void;
    oncancel: () => void;
  }

  let { actor, initial, onsave, oncancel }: Props = $props();
  /* svelte-ignore state_referenced_locally */
  let x = $state(initial.x);
  /* svelte-ignore state_referenced_locally */
  let y = $state(initial.y);
  /* svelte-ignore state_referenced_locally */
  let scale = $state(initial.scale);
  let dragging = $state(false);
  let lastX = 0;
  let lastY = 0;

  function pointerDown(event: PointerEvent) {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent) {
    if (!dragging) return;
    x += event.clientX - lastX;
    y += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
  }

  function pointerUp(event: PointerEvent) {
    dragging = false;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  }

  const reset = () => {
    x = 0;
    y = 0;
    scale = 1;
  };
</script>

<div class="chat-art-config">
  <div
    class="gl-card chat-art-card"
    class:dragging
    role="img"
    aria-label={`Chat card portrait preview for ${actor.name}`}
    onpointerdown={pointerDown}
    onpointermove={pointerMove}
    onpointerup={pointerUp}
    onpointercancel={pointerUp}
  >
    <div class="gl-card-hero gl-card-hero--art gl-card-hero--minimal" style={`--gl-art-x:${x}px;--gl-art-y:${y}px;--gl-art-scale:${scale}`}>
      <img class="gl-card-art gl-card-art--back" src={actor.img} alt="" />
      <img class="gl-card-art gl-card-art--subject" src={actor.img} alt={actor.name} />
      <div class="gl-card-id"><span class="gl-card-actor">{actor.name}</span></div>
      <div class="gl-card-tally gl-out-success">
        <div class="gl-tally-num"><b>4</b></div>
        <div class="gl-tally-copy"><span class="gl-badge">Success</span><span class="gl-tally-pool">Strength + Brawl</span></div>
      </div>
    </div>
  </div>
  <p class="hint">Drag the image directly, or enter any values below. Off-card positions and unrestricted scaling are allowed.</p>
  <div class="fields">
    <label><span>X offset</span><input type="number" step="1" bind:value={x} /></label>
    <label><span>Y offset</span><input type="number" step="1" bind:value={y} /></label>
    <label><span>Scale</span><input type="number" step="0.05" bind:value={scale} /></label>
  </div>
  <div class="actions">
    <button class="reset" type="button" onclick={reset}>Reset</button>
    <button type="button" onclick={oncancel}>Cancel</button>
    <button class="save" type="button" onclick={() => onsave({ x, y, scale })}>Save framing</button>
  </div>
</div>

<style>
  .chat-art-config { padding: 16px 18px 18px; color: var(--gl-ink); background: var(--gl-parch); }
  .chat-art-card { width: 320px; max-width: 100%; margin: 0 auto; user-select: none; touch-action: none; cursor: grab; }
  .chat-art-card.dragging { cursor: grabbing; }
  .hint { margin: 10px 0 14px; color: var(--gl-muted-2); font-size: 12px; text-align: center; }
  .fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  label { display: grid; gap: 4px; }
  label span { font-family: var(--gl-cond); font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--gl-muted); }
  input { width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid var(--gl-line); background: var(--gl-parch-raise); color: var(--gl-ink); }
  .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  button { padding: 7px 12px; border: 1px solid var(--gl-line); background: transparent; color: var(--gl-ink); cursor: pointer; }
  button.reset { margin-right: auto; }
  button.save { border-color: var(--gl-blood); background: var(--gl-blood); color: var(--gl-parch); }
  @media (max-width: 380px) { .fields { grid-template-columns: 1fr; } }
</style>
