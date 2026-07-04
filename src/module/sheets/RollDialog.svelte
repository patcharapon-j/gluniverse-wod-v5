<script lang="ts">
  import { ATTRIBUTE_KEYS, SKILL_KEYS } from "../config.ts";
  import { label, prettify } from "../components/labels.ts";
  import { disciplineRating } from "../dice/pool.ts";
  import { resonanceDieBonus } from "../vtm/lore.ts";
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
  let difficulty = $state(seed.difficulty ?? 0);
  let hunger = $state(sys.hunger ?? 0);
  let bloodSurge = $state(false);
  let useResonance = $state(true);
  let chosenSpecs = $state<Record<string, boolean>>({});

  /* svelte-ignore state_referenced_locally */
  const fixedPool = seed.fixedPool ?? 0;

  const attrVal = $derived(attribute ? (sys.attributes?.[attribute]?.value ?? 0) : 0);
  const skillVal = $derived(skill ? (sys.skills?.[skill]?.value ?? 0) : 0);
  const discVal = $derived(discipline ? disciplineRating(actor, discipline) : 0);
  const specialties = $derived<string[]>(skill ? (sys.skills?.[skill]?.specialties ?? []) : []);
  const specBonus = $derived(specialties.filter((s) => chosenSpecs[s]).length);
  const surge = $derived(bloodSurge ? bloodSurgeBonus(sys.bloodPotency ?? 0) : 0);

  // Resonance: an Intense/Acute draught grants +dice to its linked Disciplines.
  // It applies when the roll uses such a Discipline — either picked here or,
  // for a power that resolved its own pool, named via `seed.resonanceFor`.
  const resoDisc = $derived(discipline || seed.resonanceFor || "");
  const resoAvail = $derived.by(() => {
    const b = resonanceDieBonus(sys.resonance);
    return b.dice > 0 && resoDisc && b.disciplines.includes(resoDisc as any)
      ? b
      : { dice: 0, disciplines: [] as string[] };
  });
  const resonance = $derived(useResonance ? resoAvail.dice : 0);

  const pool = $derived(
    Math.max(0, fixedPool + attrVal + skillVal + discVal + specBonus + modifier + resonance),
  );
  const totalPool = $derived(pool + surge);

  // Tactile dice tray: split the pool into normal (black) and Hunger (red) dice.
  const hungerDice = $derived(Math.min(Math.max(0, hunger), totalPool));
  const normalDice = $derived(totalPool - hungerDice);

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

<div class="gl-roll" class:surging={bloodSurge}>
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
      <span>Difficulty <i>(0 = none)</i></span>
      <input type="number" min="0" bind:value={difficulty} title="0 — no difficulty: the card just counts successes" />
    </label>
  </div>

  <label class="surge">
    <input type="checkbox" bind:checked={bloodSurge} />
    <span>Blood Surge <i>(+{bloodSurgeBonus(sys.bloodPotency ?? 0)} dice, costs a Rouse check)</i></span>
  </label>

  {#if resoAvail.dice > 0}
    <label class="surge reso-toggle" class:on={useResonance}>
      <input type="checkbox" bind:checked={useResonance} />
      <span>Resonance <i>(+{resoAvail.dice} to {label("Disciplines", resoDisc)} — {prettify(sys.resonance?.type ?? "")})</i></span>
    </label>
  {/if}

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
        resonance ? `${resonance} reso` : "",
        surge ? `${surge} surge` : "",
      ].filter(Boolean).join(" + ")}
      · <b class="hunger">{hungerDice}</b> Hunger · {difficulty > 0 ? `DC ${difficulty}` : "count successes"}
    </div>
  </div>

  <!-- Tactile dice tray: black stones are the pool, blood-red stones are Hunger.
       Seeing the red creep in is meant to make the Hunger felt, not just counted. -->
  {#if totalPool > 0}
    <div class="dice-tray" aria-hidden="true">
      {#each Array.from({ length: normalDice }, (_, i) => i) as i (`n${i}`)}
        <span class="die"></span>
      {/each}
      {#each Array.from({ length: hungerDice }, (_, i) => i) as i (`h${i}`)}
        <span class="die hunger"></span>
      {/each}
    </div>
  {/if}

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
    transition: background 0.4s ease, box-shadow 0.4s ease;
  }

  /* Blood Surge engaged: the whole dialog flushes red so spending the Rouse
     feels tactile — parchment tints toward blood, the surge row ignites, and
     the pool number and Roll button glow. */
  .gl-roll.surging {
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--gl-blood) 16%, var(--gl-parch)),
        color-mix(in srgb, var(--gl-blood) 6%, var(--gl-parch)) 55%,
        var(--gl-parch)
      );
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--gl-blood) 55%, transparent),
      inset 0 0 48px color-mix(in srgb, var(--gl-blood) 22%, transparent);
    animation: gl-surge-throb 2.2s ease-in-out infinite;
  }
  @keyframes gl-surge-throb {
    0%, 100% {
      box-shadow:
        inset 0 0 0 1px color-mix(in srgb, var(--gl-blood) 55%, transparent),
        inset 0 0 48px color-mix(in srgb, var(--gl-blood) 22%, transparent);
    }
    50% {
      box-shadow:
        inset 0 0 0 1px color-mix(in srgb, var(--gl-blood) 75%, transparent),
        inset 0 0 64px color-mix(in srgb, var(--gl-blood) 34%, transparent);
    }
  }
  .gl-roll.surging .surge {
    border-color: var(--gl-blood);
    background: color-mix(in srgb, var(--gl-blood) 12%, transparent);
  }
  .gl-roll.surging .surge span {
    color: var(--gl-blood-bright);
    font-weight: 600;
  }
  .gl-roll.surging .surge span i {
    color: var(--gl-blood);
  }
  .gl-roll.surging .pv-num {
    color: var(--gl-blood-bright);
    text-shadow: 0 0 14px color-mix(in srgb, var(--gl-blood-bright) 55%, transparent);
  }
  .gl-roll.surging .preview {
    border-color: color-mix(in srgb, var(--gl-blood) 45%, var(--gl-line));
  }
  .gl-roll.surging .btn.go {
    background: var(--gl-blood-bright);
    border-color: var(--gl-blood-bright);
    box-shadow: 0 0 12px color-mix(in srgb, var(--gl-blood-bright) 50%, transparent);
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
  .specs-h i,
  .knob span i {
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
    border: 1px solid transparent;
    border-radius: 3px;
    padding: 6px 8px;
    transition: background 0.3s ease, border-color 0.3s ease;
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

  /* Resonance toggle lights gold rather than blood — it empowers, it doesn't
     cost. */
  .reso-toggle.on {
    border-color: var(--gl-gold, #c8a86b);
    background: color-mix(in srgb, var(--gl-gold, #c8a86b) 12%, transparent);
  }
  .reso-toggle.on span {
    color: var(--gl-gold, #c8a86b);
    font-weight: 600;
  }
  .reso-toggle.on span i {
    color: color-mix(in srgb, var(--gl-gold, #c8a86b) 80%, var(--gl-ink));
  }

  /* Dice tray — one stone per die, so the pool has a physical weight. Normal
     dice are dark; Hunger dice glow blood-red with a soft pulse. */
  .dice-tray {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
  }
  /* Normal dice are frosted glass — translucent, blurred, catching light — so
     the pool reads as cool and inert against the blood-red Hunger stones. */
  .die {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    flex: none;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(155deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.12));
    backdrop-filter: blur(6px) saturate(130%);
    -webkit-backdrop-filter: blur(6px) saturate(130%);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.75),
      inset 0 -3px 6px rgba(40, 20, 25, 0.1),
      0 1px 3px rgba(20, 10, 12, 0.18);
  }
  /* A slanted glare streak sells the glass. */
  .die::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      125deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(255, 255, 255, 0) 42%
    );
    pointer-events: none;
  }
  /* A small centred pip evokes a d10 face without drawing a whole die. */
  .die::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    transform: translate(-50%, -50%) rotate(45deg);
    background: rgba(60, 38, 42, 0.4);
    border-radius: 1px;
  }
  .die.hunger {
    background:
      radial-gradient(
        circle at 50% 38%,
        var(--gl-blood-bright, #d21f28),
        var(--gl-blood, #7a1016) 78%
      );
    border-color: #4a0206;
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.22),
      inset 0 -2px 4px rgba(0, 0, 0, 0.5),
      0 0 8px color-mix(in srgb, var(--gl-blood-bright, #d21f28) 65%, transparent);
    animation: gl-hunger-pulse 2.4s ease-in-out infinite;
  }
  .die.hunger::after {
    background: rgba(255, 235, 235, 0.9);
  }
  @keyframes gl-hunger-pulse {
    0%,
    100% {
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.22),
        inset 0 -2px 4px rgba(0, 0, 0, 0.5),
        0 0 8px color-mix(in srgb, var(--gl-blood-bright, #d21f28) 55%, transparent);
    }
    50% {
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.22),
        inset 0 -2px 4px rgba(0, 0, 0, 0.5),
        0 0 14px color-mix(in srgb, var(--gl-blood-bright, #d21f28) 85%, transparent);
    }
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
