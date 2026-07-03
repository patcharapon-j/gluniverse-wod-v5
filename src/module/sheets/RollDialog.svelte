<script lang="ts">
  import { ATTRIBUTE_KEYS, SKILL_KEYS } from "../config.ts";
  import { label } from "../components/labels.ts";
  import type { RollSeed, RollDialogResult } from "../apps/RollDialogApp.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    actor: any;
    seed: RollSeed;
    onroll: (o: RollDialogResult) => void;
    oncancel: () => void;
  }
  let { actor, seed, onroll, oncancel }: Props = $props();

  /* svelte-ignore state_referenced_locally */
  const sys = actor.system;

  // `seed` is fixed for a dialog instance; capturing its initial value is intended.
  /* svelte-ignore state_referenced_locally */
  let attribute = $state(seed.attribute ?? "");
  /* svelte-ignore state_referenced_locally */
  let skill = $state(seed.skill ?? "");
  let modifier = $state(0);
  /* svelte-ignore state_referenced_locally */
  let difficulty = $state(seed.difficulty ?? 1);
  let hunger = $state(sys.hunger ?? 0);
  let bloodSurge = $state(false);

  const attrVal = $derived(attribute ? (sys.attributes?.[attribute]?.value ?? 0) : 0);
  const skillVal = $derived(skill ? (sys.skills?.[skill]?.value ?? 0) : 0);
  const surge = $derived(bloodSurge ? bloodSurgeBonus(sys.bloodPotency ?? 0) : 0);
  const pool = $derived(Math.max(0, attrVal + skillVal + modifier));
  const totalPool = $derived(pool + surge);

  // Local mirror of the blood-surge table so the preview matches the roll.
  function bloodSurgeBonus(bp: number): number {
    const table = [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
    return table[Math.max(0, Math.min(10, bp))] ?? 1;
  }

  const flavor = $derived(
    seed.flavor ??
      ([attribute && label("Attributes", attribute), skill && label("Skills", skill)]
        .filter(Boolean)
        .join(" + ") || "Dice Pool"),
  );

  function roll() {
    onroll({ pool, hunger, difficulty, flavor, bloodSurge });
  }
</script>

<div class="gl-roll">
  <div class="pickers">
    <label class="pick">
      <span>Attribute</span>
      <select bind:value={attribute}>
        <option value="">—</option>
        {#each ATTRIBUTE_KEYS as k (k)}
          <option value={k}>{label("Attributes", k)} ({sys.attributes?.[k]?.value ?? 0})</option>
        {/each}
      </select>
    </label>
    <label class="pick">
      <span>Skill</span>
      <select bind:value={skill}>
        <option value="">—</option>
        {#each SKILL_KEYS as k (k)}
          <option value={k}>{label("Skills", k)} ({sys.skills?.[k]?.value ?? 0})</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="knobs">
    <label class="knob">
      <span>Modifier</span>
      <input type="number" bind:value={modifier} />
    </label>
    <label class="knob">
      <span>Hunger</span>
      <input type="number" min="0" max="5" bind:value={hunger} />
    </label>
    <label class="knob">
      <span>Difficulty</span>
      <input type="number" min="0" bind:value={difficulty} />
    </label>
  </div>

  <label class="surge">
    <input type="checkbox" bind:checked={bloodSurge} />
    <span>Blood Surge <i>(+{bloodSurgeBonus(sys.bloodPotency ?? 0)} dice, costs a Rouse check)</i></span>
  </label>

  <div class="preview">
    <div class="pv-pool">
      <span class="pv-num">{totalPool}</span>
      <span class="pv-lbl">dice</span>
    </div>
    <div class="pv-break">
      {attrVal} + {skillVal}{modifier ? ` ${modifier < 0 ? "−" : "+"} ${Math.abs(modifier)}` : ""}{surge ? ` + ${surge}` : ""}
      · <b class="hunger">{Math.min(hunger, totalPool)}</b> Hunger · DC {difficulty}
    </div>
  </div>

  <div class="actions">
    <button class="btn ghost" onclick={oncancel}>Cancel</button>
    <button class="btn go" onclick={roll} disabled={totalPool === 0}>Roll {flavor}</button>
  </div>
</div>

<style>
  .gl-roll {
    padding: 16px 18px;
    background: var(--gl-parch);
    color: var(--gl-ink);
    font-family: var(--gl-body);
  }
  .pickers,
  .knobs {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }
  .pick {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .knob {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }
  .pick span,
  .knob span,
  .surge span {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-muted);
  }
  .surge span {
    text-transform: none;
    letter-spacing: 0;
    font-family: var(--gl-body);
    font-size: 12px;
    color: var(--gl-ink);
  }
  .surge span i {
    color: var(--gl-muted);
    font-size: 11px;
  }
  select,
  input {
    border: 1px solid var(--gl-line);
    background: var(--gl-parch-raise);
    color: var(--gl-ink);
    font-family: inherit;
    padding: 4px 6px;
  }
  .surge {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }
  .surge input {
    width: auto;
  }
  .preview {
    display: flex;
    align-items: center;
    gap: 16px;
    border-top: 1px solid var(--gl-line);
    border-bottom: 1px solid var(--gl-line);
    padding: 12px 4px;
    margin-bottom: 14px;
  }
  .pv-pool {
    display: flex;
    align-items: baseline;
    gap: 5px;
  }
  .pv-num {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 40px;
    color: var(--gl-blood);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .pv-lbl {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 10px;
    color: var(--gl-muted);
  }
  .pv-break {
    font-size: 12px;
    color: var(--gl-muted-2);
  }
  .pv-break .hunger {
    color: var(--gl-blood-bright);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .btn {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 12px;
    padding: 8px 16px;
    border: 1px solid var(--gl-ink);
    background: transparent;
    color: var(--gl-ink);
    cursor: pointer;
  }
  .btn.ghost {
    border-color: var(--gl-line);
    color: var(--gl-muted-2);
  }
  .btn.go {
    background: var(--gl-blood);
    border-color: var(--gl-blood);
    color: var(--gl-parch);
  }
  .btn.go:hover {
    background: var(--gl-blood-bright);
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
