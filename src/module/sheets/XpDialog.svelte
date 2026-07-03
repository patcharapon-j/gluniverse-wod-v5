<script lang="ts">
  import { ATTRIBUTE_KEYS, SKILL_KEYS } from "../config.ts";
  import { label } from "../components/labels.ts";
  import { xpCost, disciplineCategory } from "../vtm/xp.ts";
  import { spendXp } from "../apps/XpDialogApp.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    actor: any;
    onclose: () => void;
  }
  let { actor, onclose }: Props = $props();

  // Bumped after each purchase so the derived rows re-read the mutated document.
  let tick = $state(0);

  const clan = () => actor.system?.clan ?? "";
  const available = () => {
    void tick;
    return actor.system?.xp?.value ?? 0;
  };

  interface Row {
    label: string;
    value: number;
    max: number;
    cost: number;
    buy: () => Promise<void>;
  }

  function attrRows(): Row[] {
    void tick;
    return ATTRIBUTE_KEYS.map((k) => {
      const value = actor.system?.attributes?.[k]?.value ?? 0;
      return {
        label: label("Attributes", k),
        value,
        max: 5,
        cost: xpCost("attribute", value),
        buy: async () => {
          const ok = await spendXp(actor, xpCost("attribute", value), `${label("Attributes", k)} ${value + 1}`);
          if (ok) {
            await actor.update({ [`system.attributes.${k}.value`]: value + 1 });
            tick++;
          }
        },
      };
    });
  }

  function skillRows(): Row[] {
    void tick;
    return SKILL_KEYS.map((k) => {
      const value = actor.system?.skills?.[k]?.value ?? 0;
      return {
        label: label("Skills", k),
        value,
        max: 5,
        cost: xpCost("skill", value),
        buy: async () => {
          const ok = await spendXp(actor, xpCost("skill", value), `${label("Skills", k)} ${value + 1}`);
          if (ok) {
            await actor.update({ [`system.skills.${k}.value`]: value + 1 });
            tick++;
          }
        },
      };
    });
  }

  function discRows(): Row[] {
    void tick;
    return (actor.items ?? [])
      .filter((i: any) => i.type === "discipline")
      .map((i: any) => {
        const value = i.system?.value ?? 0;
        const cat = disciplineCategory(clan(), i.system?.discipline ?? "");
        return {
          label: i.name,
          value,
          max: 5,
          cost: xpCost(cat, value),
          buy: async () => {
            const ok = await spendXp(actor, xpCost(cat, value), `${i.name} ${value + 1}`);
            if (ok) {
              await i.update({ "system.value": value + 1 });
              tick++;
            }
          },
        } as Row;
      });
  }

  function bpRow(): Row {
    void tick;
    const value = actor.system?.bloodPotency ?? 0;
    return {
      label: "Blood Potency",
      value,
      max: 10,
      cost: xpCost("bloodPotency", value),
      buy: async () => {
        const ok = await spendXp(actor, xpCost("bloodPotency", value), `Blood Potency ${value + 1}`);
        if (ok) {
          await actor.update({ "system.bloodPotency": value + 1 });
          tick++;
        }
      },
    };
  }

  const groups = $derived([
    { title: "Attributes", rows: attrRows() },
    { title: "Skills", rows: skillRows() },
    { title: "Disciplines", rows: discRows() },
    { title: "Blood Potency", rows: [bpRow()] },
  ]);
</script>

<div class="gl-xp">
  <div class="bank">
    <span class="bank-k">Unspent XP</span>
    <span class="bank-v">{available()}</span>
  </div>

  {#each groups as g (g.title)}
    {#if g.rows.length}
      <div class="grp">
        <div class="grp-h">{g.title}</div>
        <div class="rows">
          {#each g.rows as r (r.label)}
            <div class="xrow" class:maxed={r.value >= r.max}>
              <span class="xr-name">{r.label}</span>
              <span class="xr-dots">{r.value} → {Math.min(r.value + 1, r.max)}</span>
              <span class="xr-cost">{r.cost} XP</span>
              <button
                class="xr-buy"
                disabled={r.value >= r.max || r.cost > available()}
                onclick={() => r.buy()}
                title={r.value >= r.max ? "At maximum" : r.cost > available() ? "Not enough XP" : "Raise one dot"}
              >Raise</button>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/each}

  <div class="foot">
    <button class="btn" onclick={() => onclose()}>Done</button>
  </div>
</div>

<style>
  .gl-xp {
    padding: 14px 16px;
    background: var(--gl-parch);
    color: var(--gl-ink);
    font-family: var(--gl-body);
  }
  .bank {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    border-bottom: 2px solid var(--gl-ink);
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .bank-k {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 11px;
    color: var(--gl-muted);
  }
  .bank-v {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 30px;
    color: var(--gl-blood);
    font-variant-numeric: tabular-nums;
  }
  .grp {
    margin-bottom: 14px;
  }
  .grp-h {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 11px;
    color: var(--gl-blood);
    border-bottom: 1px solid var(--gl-line);
    padding-bottom: 3px;
    margin-bottom: 6px;
  }
  .rows {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px 18px;
  }
  .xrow {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    padding: 2px 0;
  }
  .xr-name {
    font-family: var(--gl-semi);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .xr-dots {
    font-family: var(--gl-cond);
    font-size: 11px;
    color: var(--gl-muted);
  }
  .xr-cost {
    font-family: var(--gl-cond);
    font-size: 11px;
    color: var(--gl-blood);
    min-width: 44px;
    text-align: right;
  }
  .xr-buy {
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
  }
  .xr-buy:hover:not(:disabled) {
    border-color: var(--gl-blood);
    background: color-mix(in srgb, var(--gl-blood) 8%, transparent);
  }
  .xr-buy:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .xrow.maxed .xr-name {
    color: var(--gl-muted);
  }
  .foot {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
  .btn {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 12px;
    padding: 7px 16px;
    border: 1px solid var(--gl-ink);
    background: var(--gl-blood);
    color: var(--gl-parch);
    border-color: var(--gl-blood);
    cursor: pointer;
  }
</style>
