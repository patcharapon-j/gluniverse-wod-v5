<script lang="ts">
  /**
   * V5 character-creation helper. Reads the current sheet and checks each
   * spending category against the rules — the attribute spread, a chosen skill
   * distribution, two in-clan Discipline dots, and the advantage budget — showing
   * live progress so a new character can be built to spec without a rigid wizard.
   */
  import { ATTRIBUTE_KEYS, SKILL_KEYS } from "../config.ts";
  import { inClanDisciplines } from "../vtm/clans.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    snap: any;
    doc: any;
  }
  let { snap }: Props = $props();

  const sys = $derived(snap.system);
  const items = $derived(snap.items as any[]);

  // --- attributes: sorted ratings vs the fixed 4/3/3/3/2/2/2/2/1 spread -------
  const ATTR_TARGET = [4, 3, 3, 3, 2, 2, 2, 2, 1];
  const attrSorted = $derived(
    ATTRIBUTE_KEYS.map((k) => sys.attributes?.[k]?.value ?? 0).sort((a, b) => b - a),
  );
  const attrOk = $derived(attrSorted.join(",") === ATTR_TARGET.join(","));

  // --- skills: choose a distribution, compare the sorted non-zero ratings -----
  const SKILL_DISTS = {
    jack: { label: "Jack-of-all-Trades", target: [3, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    balanced: { label: "Balanced", target: [3, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1] },
    specialist: { label: "Specialist", target: [4, 3, 3, 3, 2, 2, 2, 1, 1, 1] },
  } as const;
  type DistKey = keyof typeof SKILL_DISTS;
  let dist = $state<DistKey>("balanced");
  const skillSorted = $derived(
    SKILL_KEYS.map((k) => sys.skills?.[k]?.value ?? 0).filter((v) => v > 0).sort((a, b) => b - a),
  );
  const skillTarget = $derived(SKILL_DISTS[dist].target);
  const skillOk = $derived(skillSorted.join(",") === skillTarget.join(","));

  // --- disciplines: two in-clan dots at creation ------------------------------
  const inClan = $derived(inClanDisciplines(sys.clan ?? ""));
  const discDots = $derived(
    items
      .filter((i) => i.type === "discipline" && inClan.includes(i.system?.discipline))
      .reduce((n, i) => n + (i.system?.value ?? 0), 0),
  );

  // --- advantages: 7 dots of merits/backgrounds, 2 dots of flaws --------------
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

  const tick = (ok: boolean) => (ok ? "✓" : "•");
</script>

<div class="ch">
  <div class="ch-h">Character Creation Helper</div>

  <div class="ch-row" class:ok={attrOk}>
    <span class="ch-t">{tick(attrOk)}</span>
    <span class="ch-name">Attributes</span>
    <span class="ch-detail">
      spread {attrSorted.join("·")} — target one 4, three 3, four 2, one 1
    </span>
  </div>

  <div class="ch-row" class:ok={skillOk}>
    <span class="ch-t">{tick(skillOk)}</span>
    <span class="ch-name">Skills</span>
    <span class="ch-detail">
      <select bind:value={dist}>
        {#each Object.entries(SKILL_DISTS) as [k, d] (k)}<option value={k}>{d.label}</option>{/each}
      </select>
      {skillSorted.length ? skillSorted.join("·") : "none"} — need {skillTarget.join("·")}
    </span>
  </div>

  <div class="ch-row" class:ok={discDots === 2}>
    <span class="ch-t">{tick(discDots === 2)}</span>
    <span class="ch-name">Disciplines</span>
    <span class="ch-detail">{discDots} / 2 in-clan dots{inClan.length ? "" : " — set a clan first"}</span>
  </div>

  <div class="ch-row" class:ok={advDots === 7}>
    <span class="ch-t">{tick(advDots === 7)}</span>
    <span class="ch-name">Merits &amp; Backgrounds</span>
    <span class="ch-detail">{advDots} / 7 dots</span>
  </div>

  <div class="ch-row" class:ok={flawDots >= 2}>
    <span class="ch-t">{tick(flawDots >= 2)}</span>
    <span class="ch-name">Flaws</span>
    <span class="ch-detail">{flawDots} / 2 dots (at least two)</span>
  </div>

  <p class="ch-note">
    Health and Willpower derive from Stamina + 3 and Composure + Resolve. Set Blood
    Potency 1 and Humanity 7 for a starting Kindred, then earn and spend XP to advance.
  </p>
</div>

<style>
  .ch {
    padding: 12px 30px 16px;
    background: var(--gl-parch-raise);
    border-bottom: 1px solid var(--gl-line);
  }
  .ch-h {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 11px;
    color: var(--gl-blood);
    margin-bottom: 8px;
  }
  .ch-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 12px;
    padding: 3px 0;
    color: var(--gl-muted-2);
    border-top: 1px dotted var(--gl-line-soft);
  }
  .ch-t {
    width: 14px;
    text-align: center;
    color: var(--gl-muted);
    font-weight: 700;
  }
  .ch-row.ok .ch-t {
    color: var(--gl-good);
  }
  .ch-name {
    font-family: var(--gl-semi);
    font-weight: 600;
    color: var(--gl-ink);
    min-width: 150px;
  }
  .ch-detail {
    flex: 1;
  }
  .ch-detail select {
    font-family: inherit;
    font-size: 11px;
    border: 1px solid var(--gl-line);
    background: var(--gl-parch);
    color: var(--gl-ink);
    padding: 1px 4px;
    margin-right: 6px;
  }
  .ch-note {
    font-size: 11px;
    color: var(--gl-muted);
    font-style: italic;
    margin: 8px 0 0;
    line-height: 1.4;
  }
</style>
