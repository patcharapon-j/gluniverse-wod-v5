<script lang="ts">
  /* Compact Storyteller dice-pool roller. Lives pinned to the bottom-right of
     the viewport (offset for the sidebar by its host), collapsible to a tab. */
  interface Props {
    onroll: (o: { pool: number; hunger: number; difficulty: number }) => void;
  }
  let { onroll }: Props = $props();

  let open = $state(true);
  let pool = $state(4);
  let hunger = $state(0);
  let difficulty = $state(2);

  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  const bump = (which: "pool" | "hunger" | "difficulty", d: number) => {
    if (which === "pool") pool = clamp(pool + d, 0, 30);
    else if (which === "hunger") hunger = clamp(hunger + d, 0, 5);
    else difficulty = clamp(difficulty + d, 0, 15);
  };
  const go = () => onroll({ pool, hunger, difficulty });
</script>

<div class="hud" class:open>
  <button class="tab" onclick={() => (open = !open)} title={open ? "Collapse" : "Storyteller pool"}>
    <span class="tab-i">⚄</span>
    {#if open}<span class="tab-t">Storyteller Pool</span>{/if}
  </button>

  {#if open}
    <div class="body">
      <div class="knobs">
        <div class="knob">
          <span class="k">Pool</span>
          <div class="stepper">
            <button onclick={() => bump("pool", -1)} aria-label="Pool down">–</button>
            <input type="number" min="0" bind:value={pool} />
            <button onclick={() => bump("pool", 1)} aria-label="Pool up">+</button>
          </div>
        </div>
        <div class="knob">
          <span class="k blood">Hunger</span>
          <div class="stepper">
            <button onclick={() => bump("hunger", -1)} aria-label="Hunger down">–</button>
            <input type="number" min="0" max="5" bind:value={hunger} />
            <button onclick={() => bump("hunger", 1)} aria-label="Hunger up">+</button>
          </div>
        </div>
        <div class="knob">
          <span class="k">DC</span>
          <div class="stepper">
            <button onclick={() => bump("difficulty", -1)} aria-label="Difficulty down">–</button>
            <input type="number" min="0" bind:value={difficulty} />
            <button onclick={() => bump("difficulty", 1)} aria-label="Difficulty up">+</button>
          </div>
        </div>
      </div>
      <button class="roll" onclick={go} disabled={pool === 0}>Roll {pool}d</button>
    </div>
  {/if}
</div>

<style>
  .hud {
    font-family: var(--gl-body);
    color: var(--gl-ink);
    background: var(--gl-parch);
    border: 1px solid var(--gl-line);
    border-left: 4px solid var(--gl-blood);
    box-shadow: 0 6px 20px -6px color-mix(in srgb, var(--gl-stage) 65%, transparent);
    border-radius: 4px;
    overflow: hidden;
    width: max-content;
  }
  .tab {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    background: var(--gl-blood);
    color: var(--gl-parch);
    border: none;
    cursor: pointer;
    padding: 5px 10px;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 10px;
  }
  .tab-i {
    font-size: 13px;
  }
  .body {
    padding: 8px 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .knobs {
    display: flex;
    gap: 8px;
  }
  .knob {
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: center;
  }
  .k {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 8px;
    color: var(--gl-muted);
  }
  .k.blood {
    color: var(--gl-blood-bright);
  }
  .stepper {
    display: flex;
    align-items: center;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    overflow: hidden;
    background: var(--gl-parch-raise);
  }
  .stepper button {
    border: none;
    background: transparent;
    color: var(--gl-blood);
    width: 20px;
    height: 24px;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
  }
  .stepper button:hover {
    background: color-mix(in srgb, var(--gl-blood) 10%, transparent);
  }
  .stepper input {
    width: 34px;
    height: 24px;
    border: none;
    border-left: 1px solid var(--gl-line);
    border-right: 1px solid var(--gl-line);
    background: transparent;
    text-align: center;
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 15px;
    color: var(--gl-ink);
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .stepper input::-webkit-outer-spin-button,
  .stepper input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .roll {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 11px;
    color: var(--gl-parch);
    background: var(--gl-blood);
    border: 1px solid var(--gl-blood);
    border-radius: 3px;
    padding: 6px;
    cursor: pointer;
  }
  .roll:hover:not(:disabled) {
    background: var(--gl-blood-bright);
  }
  .roll:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
