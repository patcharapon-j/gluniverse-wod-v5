<script lang="ts">
  import { ATTRIBUTE_KEYS, SKILL_KEYS, DISCIPLINES } from "../config.ts";
  import { label } from "../components/labels.ts";
  import type {
    RequestState,
    RequestPoolSpec,
    RequestTarget,
    OppositionSpec,
  } from "../dice/request-types.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    preselected: string[];
    onsubmit: (state: Omit<RequestState, "cancelled">) => void;
    oncancel: () => void;
  }
  let { preselected, onsubmit, oncancel }: Props = $props();

  interface Eligible {
    uuid: string;
    name: string;
    img: string;
    actor: any;
  }

  // Eligible targets: owned vampire/mortal/ghoul actors. Also the pool of actors
  // that may serve as contested opposition (same restriction, minus ownership).
  /* svelte-ignore state_referenced_locally */
  const allActors: any[] = Array.from((game as any).actors ?? []);
  const TYPES = ["vampire", "mortal", "ghoul"];

  const eligibleTargets: Eligible[] = allActors
    .filter((a) => TYPES.includes(a.type) && a.hasPlayerOwner)
    .map((a) => ({ uuid: a.uuid, name: a.name, img: a.img, actor: a }));

  const oppositionActors: Eligible[] = allActors
    .filter((a) => TYPES.includes(a.type))
    .map((a) => ({ uuid: a.uuid, name: a.name, img: a.img, actor: a }));

  // Selected target uuids (pre-seeded from controlled tokens; the prop is a
  // one-time seed for a dialog instance, so capturing its initial value is intended).
  /* svelte-ignore state_referenced_locally */
  let selected = $state<Record<string, boolean>>(
    Object.fromEntries(preselected.map((u) => [u, true])),
  );
  const selectedTargets = $derived(eligibleTargets.filter((t) => selected[t.uuid]));

  function toggle(uuid: string) {
    selected[uuid] = !selected[uuid];
  }

  // ---- Requested pool ----
  let flavor = $state("");
  let attribute = $state("");
  let skill = $state("");
  let discipline = $state("");
  let modifier = $state(0);

  // ---- Mode ----
  let mode = $state<"static" | "contested">("static");
  let difficulty = $state(2);

  // ---- Contested opposition ----
  let oppKind = $state<"actor" | "adhoc">("actor");
  // Actor opposition
  let oppActorUuid = $state("");
  let oppAttribute = $state("");
  let oppSkill = $state("");
  let oppDiscipline = $state("");
  let oppModifier = $state(0);
  // Ad-hoc opposition
  let oppLabel = $state("");
  let oppDice = $state(3);
  let oppHunger = $state(0);

  const poolChosen = $derived(!!attribute || !!skill);

  const derivedFlavor = $derived(
    [attribute && label("Attributes", attribute), skill && label("Skills", skill)]
      .filter(Boolean)
      .join(" + ") || "Roll",
  );

  const oppValid = $derived.by(() => {
    if (mode !== "contested") return true;
    if (oppKind === "actor") return !!oppActorUuid && (!!oppAttribute || !!oppSkill);
    return oppLabel.trim().length > 0 && oppDice >= 1;
  });

  const valid = $derived(selectedTargets.length >= 1 && poolChosen && oppValid);

  function buildPool(attr: string, sk: string, disc: string, mod: number): RequestPoolSpec {
    const p: RequestPoolSpec = {};
    if (attr) p.attribute = attr;
    if (sk) p.skill = sk;
    if (disc) p.discipline = disc;
    if (mod) p.modifier = mod;
    return p;
  }

  function submit() {
    if (!valid) return;

    const targets: RequestTarget[] = selectedTargets.map((t) => ({
      actorUuid: t.uuid,
      actorName: t.name,
      img: t.img,
      rolled: false,
    }));

    let opposition: OppositionSpec | undefined;
    if (mode === "contested") {
      if (oppKind === "actor") {
        const a = oppositionActors.find((o) => o.uuid === oppActorUuid);
        opposition = {
          type: "actor",
          actorUuid: oppActorUuid,
          actorName: a?.name ?? "Opposition",
          img: a?.img,
          pool: buildPool(oppAttribute, oppSkill, oppDiscipline, oppModifier),
        };
      } else {
        opposition = {
          type: "adhoc",
          label: oppLabel.trim(),
          dice: oppDice,
          hunger: oppHunger,
        };
      }
    }

    const state: Omit<RequestState, "cancelled"> = {
      flavor: flavor.trim() || derivedFlavor,
      pool: buildPool(attribute, skill, discipline, modifier),
      mode,
      difficulty: mode === "static" ? difficulty : 0,
      targets,
      ...(opposition ? { opposition } : {}),
    };

    onsubmit(state);
  }
</script>

{#snippet poolPickers(
  attr: string,
  sk: string,
  disc: string,
  mod: number,
  set: (f: "attr" | "skill" | "disc" | "mod", v: any) => void,
)}
  <div class="pickers">
    <label class="pick">
      <span>Attribute</span>
      <select value={attr} onchange={(e) => set("attr", (e.currentTarget as HTMLSelectElement).value)}>
        <option value="">—</option>
        {#each ATTRIBUTE_KEYS as k (k)}
          <option value={k}>{label("Attributes", k)}</option>
        {/each}
      </select>
    </label>
    <label class="pick">
      <span>Skill</span>
      <select value={sk} onchange={(e) => set("skill", (e.currentTarget as HTMLSelectElement).value)}>
        <option value="">—</option>
        {#each SKILL_KEYS as k (k)}
          <option value={k}>{label("Skills", k)}</option>
        {/each}
      </select>
    </label>
  </div>
  <div class="pickers">
    <label class="pick">
      <span>Discipline</span>
      <select value={disc} onchange={(e) => set("disc", (e.currentTarget as HTMLSelectElement).value)}>
        <option value="">—</option>
        {#each DISCIPLINES as k (k)}
          <option value={k}>{label("Disciplines", k)}</option>
        {/each}
      </select>
    </label>
    <label class="knob">
      <span>Modifier</span>
      <input
        type="number"
        value={mod}
        oninput={(e) => set("mod", Number((e.currentTarget as HTMLInputElement).value) || 0)}
      />
    </label>
  </div>
{/snippet}

<div class="gl-roll gl-request">
  <!-- Flavor -->
  <label class="pick full">
    <span>Flavor</span>
    <input type="text" placeholder="e.g. Spot the stalker" bind:value={flavor} />
  </label>

  <!-- Targets -->
  <div class="group">
    <span class="group-h">Targets <i>(who rolls)</i></span>
    {#if eligibleTargets.length === 0}
      <p class="empty">No player-owned vampire, mortal, or ghoul actors found.</p>
    {:else}
      <div class="chip-list">
        {#each eligibleTargets as t (t.uuid)}
          <button
            type="button"
            class="target-chip"
            class:on={selected[t.uuid]}
            onclick={() => toggle(t.uuid)}
          >
            <img class="portrait" src={t.img} alt="" />
            <span class="tname">{t.name}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Requested pool -->
  <div class="group">
    <span class="group-h">Requested pool <i>(attribute or skill required)</i></span>
    {@render poolPickers(attribute, skill, discipline, modifier, (f, v) => {
      if (f === "attr") attribute = v;
      else if (f === "skill") skill = v;
      else if (f === "disc") discipline = v;
      else modifier = v;
    })}
  </div>

  <!-- Mode toggle -->
  <div class="mode-toggle">
    <button type="button" class="mode-btn" class:on={mode === "static"} onclick={() => (mode = "static")}>
      Static DC
    </button>
    <button
      type="button"
      class="mode-btn"
      class:on={mode === "contested"}
      onclick={() => (mode = "contested")}
    >
      Contested
    </button>
  </div>

  {#if mode === "static"}
    <label class="knob full">
      <span>Difficulty <i>(0 = count successes)</i></span>
      <input type="number" min="0" bind:value={difficulty} />
    </label>
  {:else}
    <div class="group sub">
      <div class="mode-toggle inner">
        <button
          type="button"
          class="mode-btn"
          class:on={oppKind === "actor"}
          onclick={() => (oppKind = "actor")}
        >
          Actor
        </button>
        <button
          type="button"
          class="mode-btn"
          class:on={oppKind === "adhoc"}
          onclick={() => (oppKind = "adhoc")}
        >
          Ad-hoc
        </button>
      </div>

      {#if oppKind === "actor"}
        <label class="pick full">
          <span>Opposing actor</span>
          <select bind:value={oppActorUuid}>
            <option value="">—</option>
            {#each oppositionActors as o (o.uuid)}
              <option value={o.uuid}>{o.name}</option>
            {/each}
          </select>
        </label>
        <span class="group-h">Opposition pool</span>
        {@render poolPickers(oppAttribute, oppSkill, oppDiscipline, oppModifier, (f, v) => {
          if (f === "attr") oppAttribute = v;
          else if (f === "skill") oppSkill = v;
          else if (f === "disc") oppDiscipline = v;
          else oppModifier = v;
        })}
      {:else}
        <label class="pick full">
          <span>Label</span>
          <input type="text" placeholder="e.g. The stalker" bind:value={oppLabel} />
        </label>
        <div class="pickers">
          <label class="knob">
            <span>Dice</span>
            <input type="number" min="1" bind:value={oppDice} />
          </label>
          <label class="knob">
            <span>Hunger <i>(0–5)</i></span>
            <input type="number" min="0" max="5" bind:value={oppHunger} />
          </label>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Submit row -->
  <div class="actions">
    <button class="btn ghost" onclick={oncancel}>Cancel</button>
    <button class="btn go" onclick={submit} disabled={!valid}>Send Request</button>
  </div>
</div>

<style>
  .gl-roll {
    padding: 16px 18px;
    background: var(--gl-parch);
    color: var(--gl-ink);
    font-family: var(--gl-body);
  }
  .group {
    margin-bottom: 14px;
  }
  .group.sub {
    border-left: 3px solid var(--gl-blood);
    background: var(--gl-parch-raise);
    padding: 10px 12px;
  }
  .group-h {
    display: block;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-muted);
    margin-bottom: 6px;
  }
  .group-h i {
    text-transform: none;
    letter-spacing: 0;
    color: var(--gl-faint);
  }
  .empty {
    font-size: 12px;
    color: var(--gl-muted-2);
    font-style: italic;
    margin: 4px 0;
  }
  .pickers {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }
  .pick,
  .knob {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }
  .full {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-bottom: 12px;
  }
  .pick span,
  .knob span {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-muted);
  }
  .knob span i {
    text-transform: none;
    letter-spacing: 0;
    color: var(--gl-faint);
  }
  select,
  input {
    border: 1px solid var(--gl-line);
    background: var(--gl-parch-raise);
    color: var(--gl-ink);
    font-family: inherit;
    padding: 4px 6px;
  }

  /* Target chips — small portrait + name, toggle on click. */
  .chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .target-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    padding: 3px 8px 3px 3px;
    background: var(--gl-parch-raise);
    color: var(--gl-ink);
    cursor: pointer;
    font-family: var(--gl-body);
    font-size: 12px;
    transition: border-color 0.12s ease, background-color 0.12s ease, color 0.12s ease;
  }
  .target-chip .portrait {
    width: 24px;
    height: 24px;
    border-radius: 3px;
    object-fit: cover;
    flex: none;
    border: 1px solid var(--gl-line);
  }
  .target-chip.on {
    border-color: var(--gl-blood);
    background: color-mix(in srgb, var(--gl-blood) 10%, transparent);
    color: var(--gl-blood);
  }

  /* Mode toggle — two-way segmented control. */
  .mode-toggle {
    display: flex;
    gap: 0;
    margin-bottom: 12px;
  }
  .mode-toggle.inner {
    margin-bottom: 10px;
  }
  .mode-btn {
    flex: 1;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 10px;
    padding: 6px 10px;
    border: 1px solid var(--gl-line);
    background: var(--gl-parch-raise);
    color: var(--gl-muted-2);
    cursor: pointer;
  }
  .mode-btn + .mode-btn {
    border-left: none;
  }
  .mode-btn.on {
    background: var(--gl-blood);
    border-color: var(--gl-blood);
    color: var(--gl-parch);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 4px;
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
