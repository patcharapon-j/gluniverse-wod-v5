<script lang="ts">
  import { ATTRIBUTE_KEYS, SKILL_KEYS } from "../config.ts";
  import { label, prettify } from "../components/labels.ts";
  import { disciplineRating } from "../dice/pool.ts";
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

  // Disciplines the actor owns, for the "+ Discipline dots" picker.
  /* svelte-ignore state_referenced_locally */
  const ownedDisciplines: { key: string; name: string; value: number }[] = (actor.items ?? [])
    .filter((i: any) => i.type === "discipline")
    .map((i: any) => ({ key: i.system?.discipline ?? "", name: i.name, value: i.system?.value ?? 0 }))
    .filter((d: any) => d.key);

  // `seed` is fixed for a dialog instance; capturing its initial value is intended.
  /* svelte-ignore state_referenced_locally */
  let attribute = $state(seed.attribute ?? "");
  /* svelte-ignore state_referenced_locally */
  let skill = $state(seed.skill ?? "");
  /* svelte-ignore state_referenced_locally */
  let discipline = $state(seed.discipline ?? "");
  let modifier = $state(0);
  /* svelte-ignore state_referenced_locally */
  let difficulty = $state(seed.difficulty ?? 1);
  let hunger = $state(sys.hunger ?? 0);
  let bloodSurge = $state(false);
  let chosenSpecs = $state<Record<string, boolean>>({});

  /* svelte-ignore state_referenced_locally */
  const fixedPool = seed.fixedPool ?? 0;

  const attrVal = $derived(attribute ? (sys.attributes?.[attribute]?.value ?? 0) : 0);
  const skillVal = $derived(skill ? (sys.skills?.[skill]?.value ?? 0) : 0);
  const discVal = $derived(discipline ? disciplineRating(actor, discipline) : 0);
  const specialties = $derived<string[]>(skill ? (sys.skills?.[skill]?.specialties ?? []) : []);
  const specBonus = $derived(specialties.filter((s) => chosenSpecs[s]).length);
  const surge = $derived(bloodSurge ? bloodSurgeBonus(sys.bloodPotency ?? 0) : 0);
  const pool = $derived(Math.max(0, fixedPool + attrVal + skillVal + discVal + specBonus + modifier));
  const totalPool = $derived(pool + surge);

  // Local mirror of the blood-surge table so the preview matches the roll.
  function bloodSurgeBonus(bp: number): number {
    const table = [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
    return table[Math.max(0, Math.min(10, bp))] ?? 1;
  }

  const flavor = $derived(
    seed.flavor ??
      ([
        seed.poolLabel,
        attribute && label("Attributes", attribute),
        skill && label("Skills", skill),
        discipline && label("Disciplines", discipline),
      ]
        .filter(Boolean)
        .join(" + ") || "Dice Pool"),
  );

  function roll() {
    onroll({ pool, hunger, difficulty, flavor, bloodSurge });
  }
</script>

<div class="gl-roll">
  {#if seed.poolLabel}
    <div class="basepool">
      <span class="bp-lbl">{seed.poolLabel}</span>
      <span class="bp-num">{fixedPool}</span>
    </div>
  {/if}

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

  {#if ownedDisciplines.length}
    <label class="pick disc">
      <span>Discipline dots</span>
      <select bind:value={discipline}>
        <option value="">—</option>
        {#each ownedDisciplines as d (d.key)}
          <option value={d.key}>{d.name} ({d.value})</option>
        {/each}
      </select>
    </label>
  {/if}

  {#if specialties.length}
    <div class="specs">
      <span class="specs-h">Specialties <i>(+1 each)</i></span>
      <div class="spec-list">
        {#each specialties as s (s)}
          <label class="spec-chip" class:on={chosenSpecs[s]}>
            <input type="checkbox" bind:checked={chosenSpecs[s]} />
            <span>{s}</span>
          </label>
        {/each}
      </div>
    </div>
  {/if}

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
      {[
        fixedPool ? `${fixedPool} pool` : "",
        attrVal ? `${attrVal}` : "",
        skillVal ? `${skillVal}` : "",
        discVal ? `${discVal} disc` : "",
        specBonus ? `${specBonus} spec` : "",
        modifier ? `${modifier < 0 ? "−" : "+"}${Math.abs(modifier)}` : "",
        surge ? `${surge} surge` : "",
      ].filter(Boolean).join(" + ")}
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
  .basepool {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    border-left: 3px solid var(--gl-blood);
    background: var(--gl-parch-raise);
    padding: 6px 10px;
    margin-bottom: 12px;
  }
  .bp-lbl {
    font-family: var(--gl-semi);
    font-weight: 600;
    font-size: 13px;
  }
  .bp-num {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 20px;
    color: var(--gl-blood);
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
  .pick.disc {
    margin-bottom: 12px;
  }
  .knob {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }
  .pick span,
  .knob span,
  .surge span,
  .specs-h {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-muted);
  }
  .specs {
    margin-bottom: 12px;
  }
  .specs-h i {
    text-transform: none;
    letter-spacing: 0;
    color: var(--gl-faint);
  }
  .spec-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 5px;
  }
  .spec-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    padding: 2px 8px;
    cursor: pointer;
  }
  .spec-chip.on {
    border-color: var(--gl-blood);
    background: color-mix(in srgb, var(--gl-blood) 8%, transparent);
    color: var(--gl-blood);
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
  .surge input,
  .spec-chip input {
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
