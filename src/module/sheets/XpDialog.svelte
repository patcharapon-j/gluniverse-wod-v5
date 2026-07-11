<script lang="ts">
  import { onMount } from "svelte";
  import { ATTRIBUTE_KEYS, DISCIPLINES, SKILL_KEYS, SYSTEM_ID } from "../config.ts";
  import { label, prettify } from "../components/labels.ts";
  import { disciplineCategory, maxBloodPotency, xpCost, XP_CATEGORY_LABEL, type XpCategory } from "../vtm/xp.ts";
  import { activeXpSpent, xpHistory, type XpHistoryEntry, type XpPurchase } from "../vtm/xp-ledger.ts";
  import { buyWithXp, respecAllXp, undoXp } from "../apps/XpDialogApp.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props { actor: any; onclose: () => void; }
  let { actor, onclose }: Props = $props();
  let tick = $state(0);
  let tab: "spend" | "history" = $state("spend");
  let busy = $state(false);
  let specialtySkill = $state<string>(SKILL_KEYS[0]!);
  let specialtyName = $state("");
  let formulaName = $state("");
  let formulaLevel = $state(1);
  let library: any[] = $state([]);
  let libraryLoading = $state(true);
  let chosenPowers: Record<string, string> = $state({});

  const available = () => (void tick, actor.system?.xp?.value ?? 0);
  const entries = () => (void tick, xpHistory(actor).slice().reverse());
  const spent = () => (void tick, activeXpSpent(actor));
  const itemKey = (item: any) => `${item.type}:${item.name}`.toLowerCase();

  onMount(async () => {
    try {
      const packs = game.packs.filter((pack: any) => pack.metadata?.system === SYSTEM_ID && pack.documentName === "Item");
      library = (await Promise.all(packs.map((pack: any) => pack.getDocuments()))).flat()
        .filter((item: any) => ["advantage", "ritual", "ceremony", "formula", "power"].includes(item.type));
    } finally { libraryLoading = false; }
  });

  interface Row {
    key: string; label: string; value?: number; next?: number; max?: number;
    cost: number; note?: string; powerOptions?: any[]; purchase: () => XpPurchase;
  }

  async function buy(row: Row): Promise<void> {
    if (busy) return;
    busy = true;
    try { if (await buyWithXp(actor, row.purchase())) tick++; }
    catch (error) { ui?.notifications?.error?.(error instanceof Error ? error.message : String(error)); }
    finally { busy = false; }
  }

  const actorRow = (key: string, rowLabel: string, path: string, value: number, max: number, category: XpCategory): Row => ({
    key, label: rowLabel, value, next: Math.min(max, value + 1), max, cost: xpCost(category, value),
    purchase: () => ({ category, label: `${rowLabel} ${value + 1}`, cost: xpCost(category, value), target: { kind: "actor", path, before: value, after: value + 1 } }),
  });

  function eligiblePowers(discipline: string, rating: number): any[] {
    const owned = new Set((actor.items ?? []).filter((item: any) => ["power", "formula"].includes(item.type)).map((item: any) => item.name.toLowerCase()));
    if (discipline === "thinBloodAlchemy") {
      const formulae = library.filter((item) => item.type === "formula" && item.system.level <= rating && !owned.has(item.name.toLowerCase()));
      if (formulae.length) return formulae;
      return [{
        uuid: `custom-formula-${rating}`,
        name: `New level ${rating} formula`,
        type: "formula",
        system: { level: rating },
        toObject: () => ({ name: `New level ${rating} formula`, type: "formula", system: { level: rating } }),
      }];
    }
    return library.filter((item) => {
      if (item.type !== "power" || item.system.discipline !== discipline || item.system.level > rating || owned.has(item.name.toLowerCase())) return false;
      const amalgam = item.system.amalgam;
      if (!amalgam?.discipline || !amalgam.level) return true;
      return (actor.items ?? []).some((ownedItem: any) => ownedItem.type === "discipline" && ownedItem.system.discipline === amalgam.discipline && ownedItem.system.value >= amalgam.level);
    });
  }

  function selectedPower(rowKey: string, options: any[]): any {
    const id = chosenPowers[rowKey];
    return options.find((item) => item.uuid === id) ?? options[0];
  }

  function attributeRows(): Row[] {
    void tick;
    return ATTRIBUTE_KEYS.map((key) => actorRow(`attribute:${key}`, label("Attributes", key), `system.attributes.${key}.value`, actor.system.attributes[key].value, 5, "attribute"));
  }
  function skillRows(): Row[] {
    void tick;
    return SKILL_KEYS.map((key) => actorRow(`skill:${key}`, label("Skills", key), `system.skills.${key}.value`, actor.system.skills[key].value, 5, "skill"));
  }
  function disciplineRows(): Row[] {
    void tick;
    if (actor.type !== "vampire") return [];
    return (actor.items ?? []).filter((item: any) => item.type === "discipline").map((item: any) => {
      const value = item.system.value ?? 0;
      const category = disciplineCategory(actor.system.clan ?? "", item.system.discipline ?? "");
      const rowKey = `discipline:${item.id}`;
      const powerOptions = eligiblePowers(item.system.discipline, value + 1);
      return {
        key: rowKey, label: item.name, value, next: Math.min(5, value + 1), max: 5, powerOptions,
        cost: xpCost(category, value), note: powerOptions.length ? "The selected power is included with this dot." : "No eligible unowned power was found in the system compendium.",
        purchase: () => {
          const power = selectedPower(rowKey, powerOptions);
          if (!power) throw new Error(`Choose an eligible power for ${item.name}.`);
          return { category, label: `${item.name} ${value + 1} + ${power.name}`, cost: xpCost(category, value), target: { kind: "discipline", itemId: item.id, before: value, after: value + 1, powerData: power.toObject() } };
        },
      };
    });
  }
  function newDisciplineRows(): Row[] {
    void tick;
    if (actor.type !== "vampire") return [];
    const owned = new Set((actor.items ?? []).filter((item: any) => item.type === "discipline").map((item: any) => item.system.discipline));
    return DISCIPLINES.filter((key) => !owned.has(key) && (actor.system.clan !== "thinBlood" || key === "thinBloodAlchemy")).map((key) => {
      const category = disciplineCategory(actor.system.clan ?? "", key);
      const rowKey = `new-discipline:${key}`;
      const powerOptions = eligiblePowers(key, 1);
      return {
        key: rowKey, label: prettify(key), value: 0, next: 1, max: 1, cost: xpCost(category, 0), powerOptions,
        note: powerOptions.length ? "Requires the usual narrative access; the selected power is included." : "No level-1 power was found in the system compendium.",
        purchase: () => {
          const power = selectedPower(rowKey, powerOptions);
          if (!power) throw new Error(`Choose an eligible power for ${prettify(key)}.`);
          return { category, label: `${prettify(key)} 1 + ${power.name}`, cost: xpCost(category, 0), target: { kind: "discipline", before: 0, after: 1, disciplineData: { name: prettify(key), type: "discipline", system: { discipline: key, value: 1 } }, powerData: power.toObject() } };
        },
      };
    });
  }
  function advantageRows(): Row[] {
    void tick;
    return (actor.items ?? []).filter((item: any) => item.type === "advantage" && item.system.kind !== "flaw").map((item: any) => {
      const value = item.system.value ?? 0;
      const max = item.system.maxValue || 5;
      return {
        key: `advantage:${item.id}`, label: item.name, value, next: Math.min(max, value + 1), max, cost: 3,
        purchase: () => ({ category: "advantage", label: `${item.name} ${value + 1}`, cost: 3, target: { kind: "item", itemId: item.id, path: "system.value", before: value, after: value + 1 } }),
      };
    });
  }
  function bloodPotencyRows(): Row[] {
    void tick;
    if (actor.type !== "vampire") return [];
    const value = actor.system.bloodPotency ?? 0;
    const max = maxBloodPotency(actor.system.generation ?? 13, actor.system.clan === "thinBlood");
    return [actorRow("blood-potency", "Blood Potency", "system.bloodPotency", value, max, "bloodPotency")];
  }
  function libraryRows(): Row[] {
    void tick;
    const owned = new Set((actor.items ?? []).map(itemKey));
    const ghoulDisciplines = new Set((actor.items ?? []).filter((item: any) => item.type === "discipline").map((item: any) => item.system.discipline));
    const disciplineRating = (key: string) => (actor.items ?? []).find((item: any) => item.type === "discipline" && item.system.discipline === key)?.system.value ?? 0;
    return library.filter((item) => {
      if (owned.has(itemKey(item)) || (item.type === "advantage" && item.system.kind === "flaw")) return false;
      if (item.type === "power") return actor.type === "ghoul" && item.system.level === 1 && ghoulDisciplines.has(item.system.discipline);
      if (item.type === "ritual") return actor.type === "vampire" && disciplineRating("bloodSorcery") >= (item.system.level ?? 1);
      if (item.type === "ceremony") return actor.type === "vampire" && disciplineRating("oblivion") >= (item.system.level ?? 1);
      if (item.type === "formula") return actor.type === "vampire" && actor.system.clan === "thinBlood" && disciplineRating("thinBloodAlchemy") >= (item.system.level ?? 1);
      return item.type === "advantage";
    }).map((item) => {
      const level = item.type === "advantage" ? (item.system.value ?? 1) : (item.system.level ?? 1);
      const category = (item.type === "power" ? "ghoulPower" : item.type === "advantage" ? "advantage" : item.type) as XpCategory;
      const cost = item.type === "power" ? 10 : level * 3;
      return {
        key: `library:${item.uuid ?? itemKey(item)}`, label: item.name, cost,
        note: item.type === "advantage" ? `${prettify(item.system.kind)} · ${level} dot${level === 1 ? "" : "s"}` : `${prettify(item.type)} · level ${level}`,
        purchase: () => ({ category, label: item.name, cost, target: { kind: "createItem", data: item.toObject() } }),
      };
    });
  }

  async function addSpecialty(): Promise<void> {
    const name = specialtyName.trim();
    const skill = actor.system.skills[specialtySkill];
    if (!name || !skill || (skill.value ?? 0) < 1) return;
    const before = [...(skill.specialties ?? [])];
    if (before.some((entry: string) => entry.toLowerCase() === name.toLowerCase())) return;
    await buy({
      key: "specialty", label: `${label("Skills", specialtySkill)} (${name})`, cost: 3,
      purchase: () => ({ category: "specialty", label: `${label("Skills", specialtySkill)} specialty: ${name}`, cost: 3, target: { kind: "actor", path: `system.skills.${specialtySkill}.specialties`, before, after: [...before, name] } }),
    });
    specialtyName = "";
  }
  async function addFormula(): Promise<void> {
    const name = formulaName.trim();
    const alchemy = (actor.items ?? []).find((item: any) => item.type === "discipline" && item.system.discipline === "thinBloodAlchemy")?.system.value ?? 0;
    if (!name || actor.type !== "vampire" || actor.system.clan !== "thinBlood" || formulaLevel > alchemy) return;
    const level = Math.max(1, Math.min(5, formulaLevel));
    await buy({
      key: "formula", label: name, cost: level * 3,
      purchase: () => ({ category: "formula", label: name, cost: level * 3, target: { kind: "createItem", data: { name, type: "formula", system: { level } } } }),
    });
    formulaName = "";
  }
  async function undo(entry: XpHistoryEntry): Promise<void> {
    if (busy || entry.undone) return;
    busy = true;
    try { if (await undoXp(actor, entry)) tick++; }
    catch (error) { ui?.notifications?.error?.(error instanceof Error ? error.message : String(error)); }
    finally { busy = false; }
  }
  async function respec(): Promise<void> {
    const active = entries().filter((entry) => !entry.undone);
    if (!active.length || busy) return;
    const DialogV2 = foundry.applications?.api?.DialogV2;
    const confirmed = DialogV2?.confirm
      ? await DialogV2.confirm({ window: { title: "Respec all XP purchases?" }, content: `<p>Reverse ${active.length} tracked purchase${active.length === 1 ? "" : "s"} and refund the XP?</p>`, modal: true, rejectClose: false })
      : confirm("Reverse all tracked XP purchases?");
    if (!confirmed) return;
    busy = true;
    try { await respecAllXp(actor); tick++; }
    catch (error) { ui?.notifications?.error?.(error instanceof Error ? error.message : String(error)); }
    finally { busy = false; }
  }
  const groups = () => [
    { title: "Attributes", rows: attributeRows() }, { title: "Skills", rows: skillRows() },
    { title: "Disciplines", rows: disciplineRows() }, { title: "New Disciplines", rows: newDisciplineRows() },
    { title: "Advantages & Backgrounds", rows: advantageRows() }, { title: "Blood Potency", rows: bloodPotencyRows() },
  ];
</script>

<div class="gl-xp">
  <header class="bank"><div><span>Unspent</span><strong>{available()} XP</strong></div><div><span>Tracked spend</span><strong>{spent()} XP</strong></div></header>
  <nav class="tabs"><button class:active={tab === "spend"} onclick={() => (tab = "spend")}>Spend</button><button class:active={tab === "history"} onclick={() => (tab = "history")}>History ({entries().length})</button></nav>
  {#if tab === "spend"}
    {#each groups() as group (group.title)}{#if group.rows.length}<section class="grp"><h3>{group.title}</h3><div class="rows">{#each group.rows as row (row.key)}
      <div class="xrow" class:maxed={row.max !== undefined && (row.value ?? 0) >= row.max}><span class="name">{row.label}{#if row.note}<small>{row.note}</small>{/if}{#if row.powerOptions?.length}<select class="power-select" value={chosenPowers[row.key] ?? row.powerOptions[0].uuid} onchange={(event) => (chosenPowers[row.key] = event.currentTarget.value)}>{#each row.powerOptions as power (power.uuid)}<option value={power.uuid}>{power.name} (level {power.system.level})</option>{/each}</select>{/if}</span>{#if row.value !== undefined}<span class="dots">{row.value} → {row.next}</span>{/if}<span class="cost">{row.cost} XP</span><button disabled={busy || row.cost > available() || (row.max !== undefined && (row.value ?? 0) >= row.max) || (row.powerOptions !== undefined && row.powerOptions.length === 0)} onclick={() => buy(row)}>Buy</button></div>
    {/each}</div></section>{/if}{/each}
    <section class="grp"><h3>New Specialty</h3><div class="formrow"><select bind:value={specialtySkill}>{#each SKILL_KEYS as key}<option value={key}>{label("Skills", key)}</option>{/each}</select><input bind:value={specialtyName} placeholder="Specialty name" onkeydown={(event) => event.key === "Enter" && addSpecialty()} /><span class="cost">3 XP</span><button disabled={busy || !specialtyName.trim() || (actor.system.skills[specialtySkill]?.value ?? 0) < 1 || available() < 3} onclick={addSpecialty}>Add</button></div><p class="hint">The Skill must have at least one dot.</p></section>
    {#if actor.type === "vampire" && actor.system.clan === "thinBlood"}<section class="grp"><h3>New Thin-Blood Formula</h3><div class="formrow"><input bind:value={formulaName} placeholder="Formula name" /><select bind:value={formulaLevel}>{#each [1,2,3,4,5] as level}<option value={level}>Level {level}</option>{/each}</select><span class="cost">{formulaLevel * 3} XP</span><button disabled={busy || !formulaName.trim() || available() < formulaLevel * 3 || formulaLevel > ((actor.items ?? []).find((item: any) => item.type === "discipline" && item.system.discipline === "thinBloodAlchemy")?.system.value ?? 0)} onclick={addFormula}>Learn</button></div></section>{/if}
    <section class="grp"><h3>Available to Learn</h3>{#if libraryLoading}<p class="hint">Loading system compendiums…</p>{:else if libraryRows().length === 0}<p class="hint">No unowned rituals, ceremonies, formulae, merits, or backgrounds found.</p>{:else}<div class="rows library">{#each libraryRows() as row (row.key)}<div class="xrow"><span class="name">{row.label}<small>{row.note}</small></span><span class="cost">{row.cost} XP</span><button disabled={busy || row.cost > available()} onclick={() => buy(row)}>Learn</button></div>{/each}</div>{/if}</section>
  {:else}
    <section class="history-head"><div><strong>{spent()} XP currently spent</strong><small>Refunded entries remain visible as an audit trail.</small></div><button class="danger" disabled={busy || !entries().some((entry) => !entry.undone)} onclick={respec}>Respec all</button></section>
    <div class="history">{#if entries().length === 0}<p class="hint">No tracked XP purchases yet.</p>{/if}{#each entries() as entry (entry.id)}<div class="hrow" class:undone={entry.undone}><span class="name"><b>{entry.label}</b><small>{XP_CATEGORY_LABEL[entry.category as XpCategory] ?? prettify(entry.category)} · {new Date(entry.createdAt).toLocaleString()}</small></span><span class="cost">{entry.cost} XP</span><button disabled={busy || entry.undone} onclick={() => undo(entry)}>{entry.undone ? "Refunded" : "Undo"}</button></div>{/each}</div>
  {/if}
  <footer><button onclick={onclose}>Done</button></footer>
</div>

<style>
  .power-select{display:block;width:100%;margin-top:3px;border:1px solid var(--gl-line);background:var(--gl-parch-raise);font-size:10px}
  .gl-xp{padding:14px 16px;background:var(--gl-parch);color:var(--gl-ink);font-family:var(--gl-body);min-height:420px}.bank{display:flex;justify-content:space-between;border-bottom:2px solid var(--gl-ink);padding-bottom:9px}.bank div{display:flex;flex-direction:column}.bank span,h3,.tabs button{font-family:var(--gl-cond);text-transform:uppercase;letter-spacing:2px}.bank span{font-size:9px;color:var(--gl-muted)}.bank strong{font-family:var(--gl-serif);font-size:24px;color:var(--gl-blood)}.tabs{display:flex;border-bottom:1px solid var(--gl-line);margin:10px 0}.tabs button{border:0;border-bottom:2px solid transparent;background:transparent;padding:6px 14px;font-size:11px;cursor:pointer}.tabs button.active{color:var(--gl-blood);border-color:var(--gl-blood)}.grp{margin:0 0 14px}.grp h3{font-size:10px;color:var(--gl-blood);border-bottom:1px solid var(--gl-line);margin:0 0 5px;padding-bottom:3px}.rows{display:grid;grid-template-columns:1fr 1fr;gap:3px 16px}.rows.library{max-height:250px;overflow:auto}.xrow,.hrow,.formrow{display:flex;align-items:center;gap:8px;min-height:28px;font-size:12px}.name{flex:1;min-width:0}.name small,.history-head small{display:block;color:var(--gl-muted);font-size:9px;line-height:1.2}.dots{color:var(--gl-muted);font-family:var(--gl-cond)}.cost{min-width:44px;text-align:right;color:var(--gl-blood);font:11px var(--gl-cond)}button{font-family:var(--gl-cond);cursor:pointer}button:disabled{opacity:.4;cursor:not-allowed}.xrow>button,.hrow>button,.formrow>button{border:1px solid var(--gl-line);background:transparent;color:var(--gl-blood);padding:2px 8px}.maxed{opacity:.5}.formrow input,.formrow select{min-width:0;border:1px solid var(--gl-line);background:var(--gl-parch-raise);padding:4px}.formrow input{flex:1}.hint{font-size:11px;color:var(--gl-muted);font-style:italic}.history-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.danger{color:var(--gl-blood);border:1px solid var(--gl-blood);background:transparent;padding:5px 9px}.history{max-height:460px;overflow:auto}.hrow{border-bottom:1px dotted var(--gl-line);padding:4px 0}.hrow.undone{text-decoration:line-through;opacity:.55}footer{display:flex;justify-content:flex-end;border-top:1px solid var(--gl-line);margin-top:12px;padding-top:10px}footer button{background:var(--gl-blood);color:var(--gl-parch);border:0;padding:7px 16px}@media(max-width:620px){.rows{grid-template-columns:1fr}}
</style>
