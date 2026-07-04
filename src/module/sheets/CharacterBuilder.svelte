<script lang="ts">
  /**
   * Step-by-step V5 character builder.
   *
   * Each step edits the actor directly (no staging), and steps that grant
   * character options — Disciplines, Advantages, Equipment — list the actual
   * compendium content so the player can read and pick items instead of typing
   * them in. Budgets come from world settings via `getCreationRules` and are
   * soft: a step over or under budget shows a warning but never blocks Next.
   */
  import {
    ATTRIBUTES,
    SKILLS,
    CLANS,
    PREDATOR_TYPES,
    SYSTEM_ID,
    ADVANTAGE_KINDS,
  } from "../config.ts";
  import { label, prettify } from "../components/labels.ts";
  import { inClanDisciplines, clanBane, clanCompulsion } from "../vtm/clans.ts";
  import { predatorProfile } from "../vtm/predators.ts";
  import { getCreationRules, compareSpread } from "../vtm/creation.ts";
  import { addItemToActor } from "../apps/actor-items.ts";
  import { applyPredatorGrants, clearPredatorGrants } from "../apps/predator.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    doc: any;
    snap: any;
    onclose: () => void;
  }
  let { doc, snap, onclose }: Props = $props();

  const sys = $derived(snap.system);
  const items = $derived(snap.items as any[]);
  const rules = getCreationRules();

  // --- compendium content -----------------------------------------------------
  let packsLoaded = $state(false);
  let packDisciplines = $state<any[]>([]);
  let packPowers = $state<any[]>([]);
  let packAdvantages = $state<any[]>([]);
  let packEquipment = $state<any[]>([]);

  async function loadPacks() {
    const load = async (name: string) => {
      try {
        return (await (game as any).packs.get(`${SYSTEM_ID}.${name}`)?.getDocuments()) ?? [];
      } catch {
        return [];
      }
    };
    const [disc, adv, eq] = await Promise.all([
      load("disciplines"),
      load("advantages"),
      load("equipment"),
    ]);
    packDisciplines = disc
      .filter((d: any) => d.type === "discipline")
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
    packPowers = disc
      .filter((d: any) => d.type === "power")
      .sort((a: any, b: any) => (a.system.level ?? 0) - (b.system.level ?? 0) || a.name.localeCompare(b.name));
    packAdvantages = adv.sort((a: any, b: any) => a.name.localeCompare(b.name));
    packEquipment = eq.sort((a: any, b: any) => a.name.localeCompare(b.name));
    packsLoaded = true;
  }
  loadPacks();

  // --- predator type benefits -------------------------------------------------
  const advByName = $derived(new Map(packAdvantages.map((a) => [a.name, a])));
  const predProfile = $derived(sys.predator ? predatorProfile(sys.predator) : undefined);
  const predGrant = $derived((snap.flags as any)?.[SYSTEM_ID]?.predatorGrants);
  const predApplied = $derived(!!sys.predator && predGrant?.predator === sys.predator);
  const forbiddenForClan = $derived(!!predProfile?.forbiddenClans?.includes(sys.clan ?? ""));

  let predChoices = $state<Record<number, any>>({});
  let lastPredator = $state<string>("__init__");
  $effect(() => {
    const p = sys.predator ?? "";
    if (p === lastPredator) return;
    lastPredator = p;
    const prof = predatorProfile(p);
    const init: Record<number, any> = {};
    prof?.benefits.forEach((b, i) => {
      if (b.kind === "specialty" || b.kind === "discipline" || b.kind === "advantageChoice") init[i] = 0;
      else if (b.kind === "pool") init[i] = Object.fromEntries(b.among.map((n) => [n, 0]));
    });
    predChoices = init;
  });

  const poolRemaining = (idx: number, total: number): number => {
    const alloc = predChoices[idx] ?? {};
    return total - Object.values(alloc).reduce((n: number, v) => n + Number(v || 0), 0);
  };
  function setPoolDot(idx: number, name: string, n: number, total: number) {
    const alloc = { ...(predChoices[idx] ?? {}) };
    const others = Object.entries(alloc).reduce((s, [k, v]) => (k === name ? s : s + Number(v || 0)), 0);
    alloc[name] = Math.max(0, Math.min(n, total - others));
    predChoices = { ...predChoices, [idx]: alloc };
  }
  const pickOption = (idx: number, oi: number) => (predChoices = { ...predChoices, [idx]: oi });

  async function applyPredator() {
    if (predProfile && sys.predator) await applyPredatorGrants(doc, sys.predator, predProfile, predChoices, advByName);
  }
  const removePredator = () => clearPredatorGrants(doc);

  const dots = (n: number) => "•".repeat(n);

  // --- budget checks (all soft) -------------------------------------------------
  const ATTRIBUTE_ENTRIES = Object.entries(ATTRIBUTES) as [string, readonly string[]][];
  const SKILL_ENTRIES = Object.entries(SKILLS) as [string, readonly string[]][];

  const attrValues = $derived(
    ATTRIBUTE_ENTRIES.flatMap(([, keys]) => keys.map((k) => sys.attributes?.[k]?.value ?? 0)),
  );
  const attrCheck = $derived(compareSpread(attrValues, rules.attributeSpread));

  let dist = $state(rules.skillDistributions[1]?.key ?? rules.skillDistributions[0]?.key ?? "balanced");
  const skillTarget = $derived(rules.skillDistributions.find((d) => d.key === dist)?.target ?? []);
  const skillValues = $derived(
    SKILL_ENTRIES.flatMap(([, keys]) => keys.map((k) => sys.skills?.[k]?.value ?? 0)).filter((v) => v > 0),
  );
  const skillCheck = $derived(compareSpread(skillValues, skillTarget));

  /** Per rating value: how many the spread grants, how many are placed, how many remain. */
  interface RatingSlot {
    rating: number;
    target: number;
    used: number;
    left: number;
  }
  function ratingSlots(current: number[], target: number[]): RatingSlot[] {
    const cnt = (list: number[]) => {
      const m = new Map<number, number>();
      for (const v of list) if (v > 0) m.set(v, (m.get(v) ?? 0) + 1);
      return m;
    };
    const cur = cnt(current);
    const tgt = cnt(target);
    const ratings = [...new Set([...cur.keys(), ...tgt.keys()])].sort((a, b) => b - a);
    return ratings.map((r) => {
      const t = tgt.get(r) ?? 0;
      const u = cur.get(r) ?? 0;
      return { rating: r, target: t, used: u, left: t - u };
    });
  }
  const attrSlots = $derived(ratingSlots(attrValues, rules.attributeSpread));
  const skillSlots = $derived(ratingSlots(skillValues, skillTarget));

  /** Remaining slots for a rating (0 when the spread doesn't grant it at all). */
  const leftFor = (slots: RatingSlot[], rating: number) =>
    slots.find((s) => s.rating === rating)?.left ?? 0;

  const inClan = $derived(inClanDisciplines(sys.clan ?? ""));
  const ownedDisciplines = $derived(items.filter((i) => i.type === "discipline"));
  const inClanDots = $derived(
    ownedDisciplines
      .filter((i) => inClan.includes(i.system?.discipline))
      .reduce((n, i) => n + (i.system?.value ?? 0), 0),
  );
  const totalDiscDots = $derived(ownedDisciplines.reduce((n, i) => n + (i.system?.value ?? 0), 0));
  // Caitiff / Thin-blood have no in-clan list: count every Discipline instead.
  const discSpent = $derived(sys.clan && inClan.length === 0 ? totalDiscDots : inClanDots);

  /** Does this Discipline count toward the creation budget? (Caitiff/Thin-blood: all do.) */
  const discCounts = (key: string) =>
    sys.clan ? (inClan.length === 0 ? true : (inClan as string[]).includes(key)) : false;
  const discBudgetLabel = $derived(sys.clan && inClan.length === 0 ? "Discipline dots" : "in-clan dots");

  const advDots = $derived(
    items
      .filter((i) => i.type === "advantage" && ["merit", "background"].includes(i.system?.kind))
      .reduce((n, i) => n + (i.system?.value ?? 0), 0),
  );
  const flawDots = $derived(
    items
      .filter((i) => i.type === "advantage" && i.system?.kind === "flaw")
      .reduce((n, i) => n + (i.system?.value ?? 0), 0),
  );

  const conceptWarnings = $derived.by(() => {
    const w: string[] = [];
    if (!String(snap.name ?? "").trim() || /^new actor/i.test(snap.name)) w.push("Give the character a name.");
    if (!sys.clan) w.push("Choose a clan — it decides the in-clan Disciplines.");
    if (!sys.predator) w.push("Choose a predator type.");
    else if (!predApplied) w.push("Add the predator type's feeding benefits to the sheet.");
    return w;
  });

  const discWarnings = $derived.by(() => {
    const w: string[] = [];
    if (!sys.clan) {
      w.push("Choose a clan first — in-clan Disciplines depend on it.");
      return w;
    }
    const kind = inClan.length === 0 ? "Discipline" : "in-clan Discipline";
    if (discSpent < rules.disciplineDots)
      w.push(`${rules.disciplineDots - discSpent} ${kind} dot(s) still to assign (${discSpent}/${rules.disciplineDots}).`);
    if (discSpent > rules.disciplineDots)
      w.push(`${discSpent - rules.disciplineDots} ${kind} dot(s) above the creation budget (${discSpent}/${rules.disciplineDots}).`);
    return w;
  });

  const advWarnings = $derived.by(() => {
    const w: string[] = [];
    if (advDots < rules.advantageDots)
      w.push(`${rules.advantageDots - advDots} Merit / Background dot(s) still to spend (${advDots}/${rules.advantageDots}).`);
    if (advDots > rules.advantageDots)
      w.push(`${advDots - rules.advantageDots} Merit / Background dot(s) above the creation budget (${advDots}/${rules.advantageDots}).`);
    if (flawDots < rules.flawDots)
      w.push(`Take at least ${rules.flawDots} dot(s) of Flaws (${flawDots}/${rules.flawDots}).`);
    return w;
  });

  const finishWarnings = $derived.by(() => {
    const w: string[] = [];
    if ((sys.bloodPotency ?? 0) !== rules.bloodPotency)
      w.push(`Blood Potency is ${sys.bloodPotency ?? 0}; this campaign starts at ${rules.bloodPotency}.`);
    if ((sys.humanity?.value ?? 0) !== rules.humanity)
      w.push(`Humanity is ${sys.humanity?.value ?? 0}; this campaign starts at ${rules.humanity}.`);
    return w;
  });

  // --- steps --------------------------------------------------------------------
  const steps = $derived([
    { key: "concept", label: "Concept", warnings: conceptWarnings },
    { key: "attributes", label: "Attributes", warnings: attrCheck.messages },
    { key: "skills", label: "Skills", warnings: skillCheck.messages },
    { key: "disciplines", label: "Disciplines", warnings: discWarnings },
    { key: "advantages", label: "Advantages", warnings: advWarnings },
    { key: "equipment", label: "Equipment", warnings: [] as string[] },
    { key: "finish", label: "Finish", warnings: finishWarnings },
  ]);
  let step = $state(0);
  const current = $derived(steps[step] ?? { key: "concept", label: "Concept", warnings: [] as string[] });

  // --- document edits -------------------------------------------------------
  function up(path: string, value: unknown) {
    doc.update({ [path]: value });
  }

  const dotsOf = (key: string) =>
    ownedDisciplines.find((i) => i.system?.discipline === key)?.system?.value ?? 0;

  async function setDisciplineDots(packDoc: any, n: number) {
    const owned = ownedDisciplines.find((i) => i.system?.discipline === packDoc.system.discipline);
    if (owned) {
      await doc.items.get(owned.id)?.update({ "system.value": n });
    } else {
      const created = await addItemToActor(doc, packDoc);
      if (created && n > 0) await created.update({ "system.value": n });
    }
  }

  const ownedPower = (pw: any) =>
    items.find((i) => i.type === "power" && i.name === pw.name && i.system?.discipline === pw.system?.discipline);
  const ownedAdv = (a: any) =>
    items.find(
      (i) => i.type === "advantage" && i.name === a.name && (i.system?.kind ?? "merit") === (a.system?.kind ?? "merit"),
    );
  const ownedEq = (e: any) => items.find((i) => i.type === e.type && i.name === e.name);

  async function toggle(owned: any, packDoc: any) {
    if (owned) await doc.items.get(owned.id)?.delete();
    else await addItemToActor(doc, packDoc);
  }

  // --- local UI state ---------------------------------------------------------
  let open: Record<string, boolean> = $state({});
  let advTab = $state<string>("background");
  let advSearch = $state("");
  let eqTab = $state<string>("weapon");

  const powersFor = (key: string) => packPowers.filter((p) => p.system?.discipline === key);
  const sortedPackDisciplines = $derived(
    [...packDisciplines].sort((a, b) => {
      const ai = inClan.includes(a.system?.discipline) ? 0 : 1;
      const bi = inClan.includes(b.system?.discipline) ? 0 : 1;
      return ai - bi || a.name.localeCompare(b.name);
    }),
  );
  const advList = $derived(
    packAdvantages.filter(
      (a) =>
        (a.system?.kind ?? "merit") === advTab &&
        (!advSearch.trim() || a.name.toLowerCase().includes(advSearch.trim().toLowerCase())),
    ),
  );

  // The Merit/Flaw lists are long, so group them by category (Haven, Feeding,
  // Mythic, …); Loresheets group by their source book. Categories render in
  // rulebook order, with anything unrecognized falling to the end.
  const CATEGORY_ORDER = [
    "Backgrounds", "Haven", "Looks", "Substance Use", "Archaic", "Bonding", "Feeding",
    "Mythic", "Psychological", "Miscellaneous", "Blood Ties", "Contagion",
    "Ingrained Discipline", "Caitiff", "Thin-Blood", "Ghoul", "Cults", "Coterie",
  ];
  let advOpenGroups = $state<Record<string, boolean>>({});
  const advGroups = $derived.by(() => {
    const byLore = advTab === "loresheet";
    const map = new Map<string, any[]>();
    for (const a of advList) {
      const key = (byLore ? a.system?.source : a.system?.category) || "Other";
      (map.get(key) ?? map.set(key, []).get(key)!).push(a);
    }
    const rank = (k: string) => {
      if (byLore) return k === "Core" ? -1 : 0; // Core first, rest alphabetical
      const i = CATEGORY_ORDER.indexOf(k);
      return i < 0 ? 999 : i;
    };
    return [...map.keys()]
      .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
      .map((name) => ({ name, items: map.get(name)! }));
  });
  const advGroupOpen = (name: string) =>
    !!advSearch.trim() || advOpenGroups[`${advTab}:${name}`] !== false;
  const toggleAdvGroup = (name: string) => {
    const k = `${advTab}:${name}`;
    advOpenGroups[k] = advOpenGroups[k] === false;
  };
  const EQ_TABS = [
    { key: "weapon", label: "Weapons" },
    { key: "armor", label: "Armor" },
    { key: "gear", label: "Gear" },
  ] as const;
  const eqList = $derived(packEquipment.filter((e) => e.type === eqTab));

  const ADV_TAB_LABELS: Record<string, string> = {
    background: "Backgrounds",
    merit: "Merits",
    flaw: "Flaws",
    loresheet: "Loresheets",
  };
</script>

<div class="gl-builder">
  <!-- stepper -->
  <nav class="stepper">
    {#each steps as s, i (s.key)}
      <button class="stp" class:active={i === step} class:warn={s.warnings.length > 0} onclick={() => (step = i)}>
        <span class="stp-n">{s.warnings.length === 0 ? "✓" : i + 1}</span>
        <span class="stp-l">{s.label}</span>
      </button>
    {/each}
  </nav>

  <div class="body">
    {#if current.key === "concept"}
      <div class="step-h">Who is this Kindred?</div>
      <p class="hint">Name the character and pick their clan and predator type. The clan decides which Disciplines are in-clan in step 4.</p>
      <div class="frm">
        <label class="fld wide">
          <span class="fk">Name</span>
          <input value={snap.name} onchange={(e) => doc.update({ name: e.currentTarget.value })} />
        </label>
        <label class="fld">
          <span class="fk">Clan</span>
          <select value={sys.clan} onchange={(e) => up("system.clan", e.currentTarget.value)}>
            <option value="">—</option>
            {#each CLANS as c (c)}<option value={c}>{label("Clans", c)}</option>{/each}
          </select>
        </label>
        <label class="fld">
          <span class="fk">Predator Type</span>
          <select value={sys.predator} onchange={(e) => up("system.predator", e.currentTarget.value)}>
            <option value="">—</option>
            {#each PREDATOR_TYPES as p (p)}<option value={p}>{label("PredatorTypes", p)}</option>{/each}
          </select>
        </label>
        <label class="fld">
          <span class="fk">Generation</span>
          <input type="number" min="3" max="16" value={sys.generation} onchange={(e) => up("system.generation", Number(e.currentTarget.value))} />
        </label>
        <label class="fld">
          <span class="fk">Sire</span>
          <input value={sys.sire} onchange={(e) => up("system.sire", e.currentTarget.value)} />
        </label>
        <label class="fld">
          <span class="fk">Ambition</span>
          <input value={sys.details?.ambition} onchange={(e) => up("system.details.ambition", e.currentTarget.value)} />
        </label>
        <label class="fld">
          <span class="fk">Desire</span>
          <input value={sys.details?.desire} onchange={(e) => up("system.details.desire", e.currentTarget.value)} />
        </label>
      </div>
      {#if sys.clan}
        <div class="claninfo">
          <div class="ci-row"><b>In-clan Disciplines</b>
            {#if inClan.length}
              {#each inClan as d (d)}<span class="chip">{label("Disciplines", d)}</span>{/each}
            {:else}
              <span class="ci-none">none — every Discipline counts as out-of-clan</span>
            {/if}
          </div>
          <div class="ci-row"><b>Bane</b> {clanBane(sys.clan)}</div>
          <div class="ci-row"><b>Compulsion</b> {clanCompulsion(sys.clan)}</div>
        </div>
      {/if}

      {#if sys.predator && predProfile}
        <div class="predinfo">
          <div class="pi-head">
            <span class="pi-title">{label("PredatorTypes", sys.predator)} — feeding benefits</span>
            {#if predApplied}
              <span class="pi-applied">✓ Added to sheet</span>
              <button class="row-add" onclick={removePredator}>Remove</button>
            {:else}
              <button class="row-add on" disabled={!packsLoaded} onclick={applyPredator}>+ Add to sheet</button>
            {/if}
          </div>
          <p class="pi-src">{predProfile.summary} <em>({predProfile.source})</em></p>
          {#if forbiddenForClan}
            <p class="pi-forbidden">⚠ {label("Clans", sys.clan)} cannot normally take this predator type.</p>
          {/if}
          <ul class="pi-list">
            {#each predProfile.benefits as b, i (i)}
              <li class="pi-b">
                {#if b.kind === "specialty"}
                  <span class="pi-k">Specialty</span>
                  <span class="pi-opts">
                    {#each b.options as o, oi (oi)}
                      <button class="chipbtn" class:sel={(predChoices[i] ?? 0) === oi} onclick={() => pickOption(i, oi)}>{label("Skills", o.skill)} ({o.specialty})</button>
                    {/each}
                  </span>
                {:else if b.kind === "discipline"}
                  <span class="pi-k">Discipline +{b.dots}</span>
                  <span class="pi-opts">
                    {#each b.options as o, oi (oi)}
                      <button class="chipbtn" class:sel={(predChoices[i] ?? 0) === oi} onclick={() => pickOption(i, oi)}>{label("Disciplines", o)}</button>
                    {/each}
                  </span>
                  {#if b.note}<span class="pi-note">{b.note}</span>{/if}
                {:else if b.kind === "advantage"}
                  <span class="pi-k">{prettify(b.advKind)}</span>
                  <span class="pi-fixed">{b.name} <b class="pi-dots">{dots(b.dots)}</b>{#if b.note} <span class="pi-note">({b.note})</span>{/if}</span>
                {:else if b.kind === "advantageChoice"}
                  <span class="pi-k">{prettify(b.advKind)}</span>
                  <span class="pi-opts">
                    {#each b.options as o, oi (oi)}
                      <button class="chipbtn" class:sel={(predChoices[i] ?? 0) === oi} onclick={() => pickOption(i, oi)}>{o.name} {dots(o.dots)}{#if o.note} ({o.note}){/if}</button>
                    {/each}
                  </span>
                {:else if b.kind === "pool"}
                  <span class="pi-k">{b.dots} {prettify(b.advKind)} dot{b.dots > 1 ? "s" : ""}</span>
                  <span class="pi-opts pool">
                    {#each b.among as name (name)}
                      <span class="pool-item">
                        <span class="pool-name">{name}</span>
                        <span class="numsel">
                          <button class="ns clear" class:sel={(predChoices[i]?.[name] ?? 0) === 0} onclick={() => setPoolDot(i, name, 0, b.dots)}>–</button>
                          {#each Array.from({ length: b.dots }, (_, k) => k + 1) as n (n)}
                            <button class="ns" class:sel={(predChoices[i]?.[name] ?? 0) === n} onclick={() => setPoolDot(i, name, n, b.dots)}>{n}</button>
                          {/each}
                        </span>
                      </span>
                    {/each}
                    <span class="pool-left" class:done={poolRemaining(i, b.dots) === 0}>{poolRemaining(i, b.dots)} left</span>
                  </span>
                  {#if b.note}<span class="pi-note">{b.note}</span>{/if}
                {:else if b.kind === "trait"}
                  <span class="pi-k">Trait</span>
                  <span class="pi-fixed">{b.delta > 0 ? "+" : ""}{b.delta} {prettify(b.trait)}</span>
                {/if}
              </li>
            {/each}
          </ul>
          {#if !predApplied}
            <p class="pi-hint">Pick your options, then add them to the sheet. Switching predator type or pressing Remove clears these grants.</p>
          {/if}
        </div>
      {/if}

    {:else if current.key === "attributes"}
      <div class="step-h">Distribute Attributes</div>
      <p class="hint">
        Click a number to give that attribute its rating. The campaign grants
        <b>{rules.attributeSpread.join(" · ")}</b>; the tracker below shows how many of each rating you have left.
      </p>
      <div class="legend">
        {#each attrSlots as s (s.rating)}
          <span class="lg" class:done={s.left === 0} class:over={s.left < 0}>
            <b class="lg-r">{s.rating}</b>
            {#if s.left > 0}<span class="lg-t">{s.left} of {s.target} left</span>
            {:else if s.left === 0}<span class="lg-t">✓ all placed</span>
            {:else}<span class="lg-t">{-s.left} over</span>{/if}
          </span>
        {/each}
        <span class="lg total" class:done={attrCheck.spent === attrCheck.budget} class:over={attrCheck.spent > attrCheck.budget}>
          <span class="lg-t">dots {attrCheck.spent}/{attrCheck.budget}</span>
        </span>
      </div>
      <div class="cols3">
        {#each ATTRIBUTE_ENTRIES as [cat, keys] (cat)}
          <div class="col">
            <div class="col-h">{prettify(cat)}</div>
            {#each keys as k (k)}
              {@const v = sys.attributes?.[k]?.value ?? 0}
              <div class="trait">
                <span class="tr-name">{label("Attributes", k)}</span>
                <span class="numsel">
                  {#each [1, 2, 3, 4, 5] as n (n)}
                    <button
                      class="ns"
                      class:sel={v === n}
                      class:dep={v !== n && leftFor(attrSlots, n) <= 0}
                      title={leftFor(attrSlots, n) > 0 ? `Set to ${n} — ${leftFor(attrSlots, n)} left` : `Set to ${n} — none left in the spread`}
                      onclick={() => up(`system.attributes.${k}.value`, n)}
                    >{n}</button>
                  {/each}
                </span>
              </div>
            {/each}
          </div>
        {/each}
      </div>

    {:else if current.key === "skills"}
      <div class="step-h">Distribute Skills</div>
      <p class="hint">
        Pick a distribution
        <select class="dist-sel" bind:value={dist}>
          {#each rules.skillDistributions as d (d.key)}<option value={d.key}>{d.label}</option>{/each}
        </select>
        then click a number to give a skill its rating — <b>–</b> clears it back to untrained.
        The tracker shows how many of each rating you have left.
      </p>
      <div class="legend">
        {#each skillSlots as s (s.rating)}
          <span class="lg" class:done={s.left === 0} class:over={s.left < 0}>
            <b class="lg-r">{s.rating}</b>
            {#if s.left > 0}<span class="lg-t">{s.left} of {s.target} left</span>
            {:else if s.left === 0}<span class="lg-t">✓ all placed</span>
            {:else}<span class="lg-t">{-s.left} over</span>{/if}
          </span>
        {/each}
        <span class="lg total" class:done={skillCheck.spent === skillCheck.budget} class:over={skillCheck.spent > skillCheck.budget}>
          <span class="lg-t">dots {skillCheck.spent}/{skillCheck.budget}</span>
        </span>
      </div>
      <div class="cols3">
        {#each SKILL_ENTRIES as [cat, keys] (cat)}
          <div class="col">
            <div class="col-h">{prettify(cat)}</div>
            {#each keys as k (k)}
              {@const v = sys.skills?.[k]?.value ?? 0}
              <div class="trait">
                <span class="tr-name" class:unset={v === 0}>{label("Skills", k)}</span>
                <span class="numsel">
                  <button
                    class="ns clear"
                    class:sel={v === 0}
                    title="Untrained"
                    onclick={() => up(`system.skills.${k}.value`, 0)}
                  >–</button>
                  {#each [1, 2, 3, 4, 5] as n (n)}
                    <button
                      class="ns"
                      class:sel={v === n}
                      class:dep={v !== n && leftFor(skillSlots, n) <= 0}
                      title={leftFor(skillSlots, n) > 0 ? `Set to ${n} — ${leftFor(skillSlots, n)} left` : `Set to ${n} — none left in the distribution`}
                      onclick={() => up(`system.skills.${k}.value`, n)}
                    >{n}</button>
                  {/each}
                </span>
              </div>
            {/each}
          </div>
        {/each}
      </div>

    {:else if current.key === "disciplines"}
      <div class="step-h">Choose Disciplines</div>
      <p class="hint">
        Click a number to rate a Discipline, then expand it to pick the individual powers your dots grant.
        The tracker shows how many of the campaign's {discBudgetLabel} you have left.
      </p>
      <div class="legend">
        <span class="lg" class:done={discSpent === rules.disciplineDots} class:over={discSpent > rules.disciplineDots}>
          <b class="lg-r">{discSpent}/{rules.disciplineDots}</b>
          {#if !sys.clan}<span class="lg-t">choose a clan first</span>
          {:else if discSpent < rules.disciplineDots}<span class="lg-t">{discBudgetLabel} — {rules.disciplineDots - discSpent} left</span>
          {:else if discSpent === rules.disciplineDots}<span class="lg-t">{discBudgetLabel} ✓ all placed</span>
          {:else}<span class="lg-t">{discBudgetLabel} — {discSpent - rules.disciplineDots} over</span>{/if}
        </span>
        {#if inClan.length && totalDiscDots > inClanDots}
          <span class="lg total">
            <span class="lg-t">out-of-clan dots {totalDiscDots - inClanDots} — usually not granted at creation</span>
          </span>
        {/if}
      </div>
      {#if !packsLoaded}
        <p class="loading">Loading compendium…</p>
      {:else if packDisciplines.length === 0}
        <p class="loading">No Discipline compendium content found.</p>
      {:else}
        {#each sortedPackDisciplines as d (d.id)}
          {@const key = d.system?.discipline}
          {@const dots = dotsOf(key)}
          {@const powers = powersFor(key)}
          <div class="pick" class:inclan={inClan.includes(key)}>
            <div class="pick-h">
              <button class="caret" class:open={open[d.id]} onclick={() => (open[d.id] = !open[d.id])} aria-label="Toggle powers">▸</button>
              <button class="pick-name" onclick={() => (open[d.id] = !open[d.id])}>{d.name}</button>
              {#if inClan.includes(key)}<span class="tag">In-clan</span>
              {:else if inClan.length}<span class="tag soft">Out-of-clan</span>{/if}
              <span class="numsel">
                <button class="ns clear" class:sel={dots === 0} title="No dots" onclick={() => setDisciplineDots(d, 0)}>–</button>
                {#each [1, 2, 3, 4, 5] as n (n)}
                  <button
                    class="ns"
                    class:sel={dots === n}
                    class:dep={dots !== n && discCounts(key) && discSpent - dots + n > rules.disciplineDots}
                    title={discCounts(key) && discSpent - dots + n > rules.disciplineDots
                      ? `Set to ${n} — exceeds the creation budget`
                      : `Set to ${n}`}
                    onclick={() => setDisciplineDots(d, n)}
                  >{n}</button>
                {/each}
              </span>
            </div>
            {#if open[d.id]}
              {#if d.system?.description}<div class="pick-desc">{@html d.system.description}</div>{/if}
              {#each powers as pw (pw.id)}
                {@const owned = ownedPower(pw)}
                <div class="row" class:owned>
                  <span class="row-lvl">{pw.system.level}</span>
                  <span class="row-main">
                    <span class="row-name">{pw.name}</span>
                    {#if pw.system.level > dots}<span class="tag soft">above rating</span>{/if}
                    {#if pw.system.amalgam?.discipline}<span class="tag soft">Amalgam: {label("Disciplines", pw.system.amalgam.discipline)} {pw.system.amalgam.level}</span>{/if}
                    <span class="row-detail">
                      {#if pw.system.cost}<b>Cost</b> {pw.system.cost}{/if}
                      {#if pw.system.pool}&ensp;<b>Pool</b> {pw.system.pool}{/if}
                    </span>
                    {#if pw.system.description}<span class="row-desc">{@html pw.system.description}</span>{/if}
                  </span>
                  <button class="row-add" class:on={!!owned} onclick={() => toggle(owned, pw)}>
                    {owned ? "✓ Added" : "+ Add"}
                  </button>
                </div>
              {/each}
            {/if}
          </div>
        {/each}
      {/if}

    {:else if current.key === "advantages"}
      <div class="step-h">Choose Advantages &amp; Flaws</div>
      <p class="hint">
        Add an entry, then click a number to set its dots right in the list.
        Merits and Backgrounds share one budget; Flaws have a minimum you must reach.
      </p>
      <div class="legend">
        <span class="lg" class:done={advDots === rules.advantageDots} class:over={advDots > rules.advantageDots}>
          <b class="lg-r">{advDots}/{rules.advantageDots}</b>
          {#if advDots < rules.advantageDots}<span class="lg-t">merit &amp; background dots — {rules.advantageDots - advDots} left</span>
          {:else if advDots === rules.advantageDots}<span class="lg-t">merits &amp; backgrounds ✓ all placed</span>
          {:else}<span class="lg-t">merits &amp; backgrounds — {advDots - rules.advantageDots} over</span>{/if}
        </span>
        <span class="lg" class:done={flawDots >= rules.flawDots}>
          <b class="lg-r">{flawDots}/{rules.flawDots}</b>
          {#if flawDots < rules.flawDots}<span class="lg-t">flaw dots — {rules.flawDots - flawDots} more needed</span>
          {:else}<span class="lg-t">flaws ✓ minimum met</span>{/if}
        </span>
      </div>
      <div class="tabs">
        {#each ADVANTAGE_KINDS as k (k)}
          <button class="tab" class:active={advTab === k} onclick={() => (advTab = k)}>{ADV_TAB_LABELS[k]}</button>
        {/each}
        <input class="search" placeholder="Search…" bind:value={advSearch} />
      </div>
      {#if !packsLoaded}
        <p class="loading">Loading compendium…</p>
      {:else if advList.length === 0}
        <p class="loading">Nothing here{advSearch ? ` matching “${advSearch}”` : ""}.</p>
      {:else}
        {@const grouped = advGroups.length > 1}
        {#each advGroups as g (g.name)}
          {@const openG = advGroupOpen(g.name)}
          {#if grouped}
            {@const ownedCount = g.items.filter((x) => ownedAdv(x)).length}
            <button class="adv-grp" class:open={openG} onclick={() => toggleAdvGroup(g.name)}>
              <span class="grp-caret">▸</span>
              <span class="grp-name">{g.name}</span>
              <span class="grp-count">{#if ownedCount}<b>{ownedCount}</b> / {/if}{g.items.length}</span>
            </button>
          {/if}
          {#if openG}
            {#each g.items as a (a.id)}
              {@const owned = ownedAdv(a)}
              <div class="row" class:owned class:ingrp={grouped}>
                <span class="row-main">
                  <span class="row-name" class:flaw={advTab === "flaw"}>{a.name}</span>
                  <span class="row-detail">
                    {#if (a.system.maxValue ?? 5) !== (a.system.value ?? 1)}<b>Dots</b> {a.system.value}–{a.system.maxValue}{:else}<b>Dots</b> {a.system.value}{/if}
                  </span>
                  {#if a.system.description}<span class="row-desc">{@html a.system.description}</span>{/if}
                </span>
                {#if owned}
                  {@const max = owned.system.maxValue || 5}
                  {@const counted = ["merit", "background"].includes(advTab)}
                  <span class="numsel">
                    {#each Array.from({ length: max }, (_, i) => i + 1) as n (n)}
                      <button
                        class="ns"
                        class:sel={owned.system.value === n}
                        class:dep={owned.system.value !== n && counted && advDots - owned.system.value + n > rules.advantageDots}
                        title={counted && advDots - owned.system.value + n > rules.advantageDots
                          ? `Set to ${n} — exceeds the creation budget`
                          : `Set to ${n}`}
                        onclick={() => doc.items.get(owned.id)?.update({ "system.value": n })}
                      >{n}</button>
                    {/each}
                  </span>
                {/if}
                <button class="row-add" class:on={!!owned} onclick={() => toggle(owned, a)}>
                  {owned ? "✕ Remove" : "+ Add"}
                </button>
              </div>
            {/each}
          {/if}
        {/each}
      {/if}

    {:else if current.key === "equipment"}
      <div class="step-h">Starting Equipment</div>
      <p class="hint">Optional — pick anything your Storyteller allows. Resources and predator type usually justify what you carry.</p>
      <div class="tabs">
        {#each EQ_TABS as t (t.key)}
          <button class="tab" class:active={eqTab === t.key} onclick={() => (eqTab = t.key)}>{t.label}</button>
        {/each}
      </div>
      {#if !packsLoaded}
        <p class="loading">Loading compendium…</p>
      {:else if eqList.length === 0}
        <p class="loading">No {eqTab} entries in the compendium.</p>
      {:else}
        {#each eqList as e (e.id)}
          {@const owned = ownedEq(e)}
          <div class="row" class:owned>
            <span class="row-main">
              <span class="row-name">{e.name}</span>
              <span class="row-detail">
                {#if e.type === "weapon"}<b>Damage</b> {e.system.damage} {e.system.damageType}{#if e.system.range}&ensp;<b>Range</b> {e.system.range}{/if}{/if}
                {#if e.type === "armor"}<b>Rating</b> {e.system.rating}{#if e.system.penalty}&ensp;<b>Penalty</b> {e.system.penalty}{/if}{/if}
              </span>
              {#if e.system.description}<span class="row-desc">{@html e.system.description}</span>{/if}
            </span>
            <button class="row-add" class:on={!!owned} onclick={() => toggle(owned, e)}>
              {owned ? "✕ Remove" : "+ Add"}
            </button>
          </div>
        {/each}
      {/if}

    {:else if current.key === "finish"}
      <div class="step-h">Final Touches</div>
      <p class="hint">Set the campaign's starting values, then review anything the builder flagged. Health and Willpower derive automatically from Stamina and Composure + Resolve.</p>

      <div class="fin-row">
        <span class="fin-k">Blood Potency</span>
        <span class="fin-v">{sys.bloodPotency ?? 0}</span>
        {#if (sys.bloodPotency ?? 0) !== rules.bloodPotency}
          <button class="row-add" onclick={() => up("system.bloodPotency", rules.bloodPotency)}>Set to {rules.bloodPotency}</button>
        {:else}<span class="ok">✓</span>{/if}
      </div>
      <div class="fin-row">
        <span class="fin-k">Humanity</span>
        <span class="fin-v">{sys.humanity?.value ?? 0}</span>
        {#if (sys.humanity?.value ?? 0) !== rules.humanity}
          <button class="row-add" onclick={() => up("system.humanity.value", rules.humanity)}>Set to {rules.humanity}</button>
        {:else}<span class="ok">✓</span>{/if}
      </div>

      <div class="review">
        <div class="col-h">Review</div>
        {#each steps.slice(0, -1) as s, i (s.key)}
          <div class="rev-row" class:ok={s.warnings.length === 0}>
            <span class="rev-t">{s.warnings.length === 0 ? "✓" : "⚠"}</span>
            <button class="rev-name" onclick={() => (step = i)}>{s.label}</button>
            <span class="rev-msgs">{s.warnings.length === 0 ? "matches the campaign's creation values" : s.warnings.join(" ")}</span>
          </div>
        {/each}
      </div>
      <p class="hint">Remember to record Convictions &amp; Touchstones on the sheet — they're free-text and personal to the chronicle.</p>
    {/if}
  </div>

  <!-- footer nav -->
  <footer class="foot">
    <button class="nav-btn" disabled={step === 0} onclick={() => (step = Math.max(0, step - 1))}>‹ Back</button>
    <div class="foot-mid">
      {#if current.warnings.length > 0}
        <div class="warnbar" role="status">
          ⚠ {current.warnings.join(" ")}
          <span class="warnnote">Outside the campaign's creation values — you can still continue.</span>
        </div>
      {/if}
    </div>
    {#if step < steps.length - 1}
      <button class="nav-btn next" onclick={() => (step = step + 1)}>Next ›</button>
    {:else}
      <button class="nav-btn next" onclick={() => onclose()}>Done</button>
    {/if}
  </footer>
</div>

<style>
  .gl-builder {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--gl-parch);
    color: var(--gl-ink);
    font-family: var(--gl-body);
  }

  /* stepper */
  .stepper {
    display: flex;
    flex-wrap: wrap;
    border-bottom: 2px solid var(--gl-ink);
    background: var(--gl-parch-raise);
  }
  .stp {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 4px;
    background: transparent;
    border: none;
    border-right: 1px solid var(--gl-line);
    cursor: pointer;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-size: 10px;
    color: var(--gl-muted-2);
  }
  .stp:last-child {
    border-right: none;
  }
  .stp.active {
    color: var(--gl-parch);
    background: var(--gl-blood);
  }
  .stp-n {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 1px solid currentColor;
    font-size: 9px;
    flex: none;
  }
  .stp:not(.warn) .stp-n {
    color: var(--gl-good);
    border-color: var(--gl-good);
  }
  .stp.active:not(.warn) .stp-n {
    color: var(--gl-parch);
    border-color: var(--gl-parch);
  }

  /* body */
  .body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 22px;
  }
  .step-h {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 22px;
    margin-bottom: 4px;
  }
  .hint {
    font-size: 12px;
    color: var(--gl-muted-2);
    margin: 0 0 14px;
    line-height: 1.5;
  }
  .loading {
    font-size: 12px;
    color: var(--gl-muted);
    font-style: italic;
  }

  /* concept form */
  .frm {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 22px;
    margin-bottom: 14px;
  }
  .fld {
    display: flex;
    flex-direction: column;
  }
  .fld.wide {
    grid-column: 1 / -1;
  }
  .fk {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 9px;
    color: var(--gl-muted);
  }
  .fld input,
  .fld select {
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 17px;
    color: var(--gl-ink);
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--gl-line);
    padding: 2px 0;
  }
  .fld input:focus,
  .fld select:focus {
    outline: none;
    border-bottom-color: var(--gl-blood);
  }
  .claninfo {
    background: var(--gl-parch-raise);
    border-left: 2px solid var(--gl-blood);
    padding: 10px 14px;
    font-size: 12px;
    line-height: 1.6;
  }
  .ci-row b {
    color: var(--gl-blood);
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 10px;
    margin-right: 6px;
  }
  .ci-none {
    font-style: italic;
    color: var(--gl-muted);
  }
  .chip {
    display: inline-block;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    padding: 0 6px;
    margin-right: 4px;
    font-size: 11px;
  }

  /* predator benefits panel */
  .predinfo {
    background: var(--gl-parch-raise);
    border: 1px solid var(--gl-line);
    border-left: 3px solid var(--gl-blood);
    padding: 10px 14px;
    margin-top: 12px;
  }
  .pi-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pi-title {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 15px;
    flex: 1;
  }
  .pi-applied {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 10px;
    color: var(--gl-good);
  }
  .pi-src {
    font-size: 12px;
    color: var(--gl-muted-2);
    margin: 4px 0 8px;
  }
  .pi-forbidden {
    font-size: 11px;
    color: var(--gl-blood);
    margin: 0 0 8px;
  }
  .pi-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .pi-b {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 5px 0;
    border-top: 1px dotted var(--gl-line-soft);
    font-size: 12px;
  }
  .pi-k {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-blood);
    min-width: 96px;
    flex: none;
  }
  .pi-opts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
  }
  .pi-opts.pool {
    gap: 12px;
  }
  .pi-fixed {
    font-family: var(--gl-semi);
    font-weight: 600;
  }
  .pi-dots {
    color: var(--gl-blood);
    letter-spacing: 1px;
  }
  .pi-note {
    font-style: italic;
    color: var(--gl-muted);
    font-size: 11px;
  }
  .chipbtn {
    font-family: var(--gl-semi);
    font-size: 11px;
    color: var(--gl-ink);
    background: transparent;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    padding: 2px 8px;
    cursor: pointer;
  }
  .chipbtn:hover {
    border-color: var(--gl-blood);
    color: var(--gl-blood);
  }
  .chipbtn.sel {
    color: var(--gl-parch);
    background: var(--gl-blood);
    border-color: var(--gl-blood);
  }
  .pool-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .pool-name {
    font-family: var(--gl-semi);
    font-weight: 600;
    font-size: 11px;
  }
  .pool-left {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-muted-2);
  }
  .pool-left.done {
    color: var(--gl-good);
  }
  .pi-hint {
    font-size: 11px;
    color: var(--gl-muted-2);
    font-style: italic;
    margin: 8px 0 0;
  }

  /* rating tracker legend */
  .legend {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    margin-bottom: 14px;
    background: var(--gl-parch-raise);
    border: 1px solid var(--gl-line);
    border-left: 3px solid var(--gl-blood);
  }
  .lg {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    padding: 2px 8px;
    background: var(--gl-parch);
  }
  .lg-r {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 16px;
    color: var(--gl-blood);
    line-height: 1;
  }
  .lg-t {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-muted-2);
    white-space: nowrap;
  }
  .lg.done {
    border-color: var(--gl-good);
  }
  .lg.done .lg-t {
    color: var(--gl-good);
  }
  .lg.over {
    border-color: var(--gl-blood);
    background: color-mix(in srgb, var(--gl-blood) 8%, var(--gl-parch));
  }
  .lg.over .lg-t {
    color: var(--gl-blood);
    font-weight: 600;
  }
  .lg.total {
    margin-left: auto;
    border-style: dotted;
  }

  /* numeric rating selector */
  .numsel {
    display: inline-flex;
    gap: 3px;
    flex: none;
  }
  .ns {
    width: 21px;
    height: 21px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-family: var(--gl-cond);
    font-weight: 600;
    font-size: 11px;
    line-height: 1;
    color: var(--gl-ink);
    background: transparent;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    cursor: pointer;
  }
  .ns:hover {
    border-color: var(--gl-blood);
    color: var(--gl-blood);
  }
  .ns.sel {
    color: var(--gl-parch);
    background: var(--gl-blood);
    border-color: var(--gl-blood);
  }
  .ns.dep {
    opacity: 0.3;
  }
  .ns.dep:hover {
    opacity: 0.75;
  }
  .ns.clear {
    color: var(--gl-muted);
  }
  .ns.clear.sel {
    color: var(--gl-parch);
    background: var(--gl-muted);
    border-color: var(--gl-muted);
  }
  .tr-name.unset {
    color: var(--gl-muted);
  }

  /* attribute / skill grids */
  .cols3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0 24px;
  }
  .col-h {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 11px;
    color: var(--gl-blood);
    border-bottom: 1px solid var(--gl-ink);
    padding-bottom: 3px;
    margin-bottom: 8px;
  }
  .trait {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 3px 0;
    font-size: 13px;
  }
  .tr-name {
    font-family: var(--gl-semi);
    font-weight: 500;
  }
  .dist-sel {
    font-family: inherit;
    font-size: 12px;
    border: 1px solid var(--gl-line);
    background: var(--gl-parch);
    color: var(--gl-ink);
    padding: 1px 4px;
  }

  /* discipline / catalogue picks */
  .pick {
    border: 1px solid var(--gl-line);
    border-left: 3px solid var(--gl-line);
    margin-bottom: 8px;
    padding: 6px 10px;
  }
  .pick.inclan {
    border-left-color: var(--gl-blood);
  }
  .pick-h {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .caret {
    background: transparent;
    border: none;
    color: var(--gl-muted);
    cursor: pointer;
    font-size: 11px;
    padding: 0;
    transition: transform 0.12s;
    line-height: 1;
  }
  .caret.open {
    transform: rotate(90deg);
  }
  .pick-name {
    font-family: var(--gl-serif);
    font-weight: 600;
    font-size: 17px;
    flex: 1;
    text-align: left;
    background: transparent;
    border: none;
    padding: 0;
    color: var(--gl-ink);
    cursor: pointer;
  }
  .pick-name:hover {
    color: var(--gl-blood);
  }
  .pick-desc {
    font-size: 12px;
    color: var(--gl-muted-2);
    margin: 4px 0 6px 20px;
  }
  .pick-desc :global(p) {
    margin: 0;
  }
  .tag {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-parch);
    background: var(--gl-blood);
    border-radius: 3px;
    padding: 1px 6px;
    flex: none;
  }
  .tag.soft {
    color: var(--gl-muted-2);
    background: transparent;
    border: 1px dotted var(--gl-line);
  }

  /* generic catalogue row */
  /* category group headers in the Advantages step */
  .adv-grp {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    margin-top: 10px;
    padding: 5px 4px;
    background: var(--gl-parch-raise);
    border: none;
    border-bottom: 1px solid var(--gl-line);
    cursor: pointer;
    text-align: left;
  }
  .adv-grp:hover {
    background: color-mix(in srgb, var(--gl-blood) 6%, var(--gl-parch-raise));
  }
  .grp-caret {
    color: var(--gl-muted);
    font-size: 10px;
    transition: transform 0.12s;
  }
  .adv-grp.open .grp-caret {
    transform: rotate(90deg);
  }
  .grp-name {
    flex: 1;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 11px;
    font-weight: 600;
    color: var(--gl-ink);
  }
  .grp-count {
    font-family: var(--gl-cond);
    font-size: 10px;
    letter-spacing: 1px;
    color: var(--gl-muted);
  }
  .grp-count b {
    color: var(--gl-good);
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 6px 2px 6px 20px;
    border-top: 1px dotted var(--gl-line-soft);
    font-size: 12px;
  }
  .row.ingrp {
    padding-left: 28px;
  }
  .row.owned {
    background: color-mix(in srgb, var(--gl-good) 7%, transparent);
  }
  .row-lvl {
    font-family: var(--gl-cond);
    font-weight: 600;
    color: var(--gl-blood);
    width: 12px;
    text-align: center;
    padding-top: 1px;
    flex: none;
  }
  .row-main {
    flex: 1;
    min-width: 0;
  }
  .row-name {
    font-family: var(--gl-semi);
    font-weight: 600;
    font-size: 13px;
    margin-right: 6px;
  }
  .row-name.flaw {
    color: var(--gl-blood);
  }
  .row-detail {
    font-family: var(--gl-cond);
    font-size: 11px;
    letter-spacing: 0.5px;
    color: var(--gl-muted-2);
  }
  .row-detail b {
    color: var(--gl-blood);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    margin-right: 3px;
  }
  .row-desc {
    display: block;
    color: var(--gl-muted-2);
    line-height: 1.45;
  }
  .row-desc :global(p) {
    display: inline;
    margin: 0;
  }
  .row-add {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    color: var(--gl-blood);
    background: transparent;
    border: 1px solid var(--gl-line);
    border-radius: 3px;
    padding: 2px 8px;
    cursor: pointer;
    flex: none;
    white-space: nowrap;
  }
  .row-add:hover {
    border-color: var(--gl-blood);
    background: color-mix(in srgb, var(--gl-blood) 8%, transparent);
  }
  .row-add.on {
    color: var(--gl-good);
    border-color: var(--gl-good);
  }

  /* tabs */
  .tabs {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
  }
  .tab {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-size: 10px;
    padding: 4px 10px;
    border: 1px solid var(--gl-line);
    background: transparent;
    color: var(--gl-muted-2);
    cursor: pointer;
  }
  .tab.active {
    color: var(--gl-parch);
    background: var(--gl-blood);
    border-color: var(--gl-blood);
  }
  .search {
    flex: 1;
    font-family: inherit;
    font-size: 12px;
    color: var(--gl-ink);
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--gl-line);
    padding: 3px 4px;
  }
  .search:focus {
    outline: none;
    border-bottom-color: var(--gl-blood);
  }

  /* finish */
  .fin-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 7px 0;
    border-bottom: 1px dotted var(--gl-line-soft);
    font-size: 13px;
  }
  .fin-k {
    font-family: var(--gl-semi);
    font-weight: 600;
    min-width: 130px;
  }
  .fin-v {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 18px;
    color: var(--gl-blood);
  }
  .ok {
    color: var(--gl-good);
    font-weight: 700;
  }
  .review {
    margin-top: 16px;
  }
  .rev-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 12px;
    padding: 4px 0;
    border-top: 1px dotted var(--gl-line-soft);
    color: var(--gl-muted-2);
  }
  .rev-t {
    width: 16px;
    text-align: center;
  }
  .rev-row.ok .rev-t {
    color: var(--gl-good);
  }
  .rev-name {
    font-family: var(--gl-semi);
    font-weight: 600;
    color: var(--gl-ink);
    min-width: 100px;
    background: transparent;
    border: none;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }
  .rev-name:hover {
    color: var(--gl-blood);
  }
  .rev-msgs {
    flex: 1;
  }

  /* footer */
  .foot {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-top: 2px solid var(--gl-ink);
    background: var(--gl-parch-raise);
  }
  .foot-mid {
    flex: 1;
    min-width: 0;
  }
  .warnbar {
    font-size: 11px;
    color: var(--gl-ink);
    background: color-mix(in srgb, var(--gl-gold) 25%, transparent);
    border: 1px solid var(--gl-gold);
    border-radius: 3px;
    padding: 4px 10px;
    line-height: 1.4;
  }
  .warnnote {
    display: block;
    font-style: italic;
    color: var(--gl-muted-2);
  }
  .nav-btn {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 11px;
    padding: 7px 16px;
    border: 1px solid var(--gl-line);
    background: transparent;
    color: var(--gl-muted-2);
    cursor: pointer;
    flex: none;
  }
  .nav-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .nav-btn.next {
    color: var(--gl-parch);
    background: var(--gl-blood);
    border-color: var(--gl-blood);
  }
  .nav-btn.next:hover {
    background: var(--gl-blood-bright);
  }
</style>
