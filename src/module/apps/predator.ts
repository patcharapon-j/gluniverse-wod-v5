/**
 * Apply (and roll back) the mechanical benefits a predator type grants, writing
 * them onto an actor during character creation.
 *
 * Grants are idempotent and switch-safe: every apply first clears the previous
 * predator's grants. Advantage items created here are tagged with a
 * `fromPredator` flag so they can be found and removed; specialties, Discipline
 * dots, and Humanity / Blood Potency deltas are recorded on a `predatorGrants`
 * actor flag so they can be reversed exactly.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SYSTEM_ID } from "../config.ts";
import { prettify } from "../components/labels.ts";
import type { PredatorProfile } from "../vtm/predators.ts";

/** The player's resolved picks, keyed by benefit index. */
export type PredatorChoices = Record<number, any>;

interface RecordedGrants {
  predator: string;
  specialties: { skill: string; specialty: string }[];
  disciplines: { key: string; dots: number }[];
  humanity: number;
  bloodPotency: number;
}

/** Build an advantage item object from a compendium doc (falls back to bare). */
function makeAdvantage(name: string, kind: string, dots: number, advByName: Map<string, any>): any {
  const src = advByName.get(name);
  const base = src ? src.toObject() : { name, type: "advantage", system: { kind } };
  delete base._id;
  base.system = { ...(base.system ?? {}), kind: base.system?.kind ?? kind, value: dots };
  base.flags = { ...(base.flags ?? {}), [SYSTEM_ID]: { ...(base.flags?.[SYSTEM_ID] ?? {}), fromPredator: true } };
  return base;
}

/** Ensure the actor owns a Discipline for `key`, then raise it by `dots` (max 5). */
async function addDisciplineDots(actor: any, key: string, dots: number): Promise<void> {
  let d = actor.items.find((i: any) => i.type === "discipline" && i.system?.discipline === key);
  if (!d) {
    const created = await actor.createEmbeddedDocuments("Item", [
      { name: prettify(key), type: "discipline", system: { discipline: key, value: 0 } },
    ]);
    d = created?.[0];
  }
  if (d) await d.update({ "system.value": Math.min(5, (d.system?.value ?? 0) + dots) });
}

/** Remove whatever the last predator grant added to this actor. */
export async function clearPredatorGrants(actor: any): Promise<void> {
  // Delete advantage items this system tagged as predator-granted.
  const tagged = actor.items.filter((i: any) => i.getFlag?.(SYSTEM_ID, "fromPredator"));
  if (tagged.length) await actor.deleteEmbeddedDocuments("Item", tagged.map((i: any) => i.id));

  const g: RecordedGrants | undefined = actor.getFlag?.(SYSTEM_ID, "predatorGrants");
  if (!g) return;

  const update: Record<string, unknown> = {};
  for (const s of g.specialties ?? []) {
    const cur: string[] = actor.system?.skills?.[s.skill]?.specialties ?? [];
    update[`system.skills.${s.skill}.specialties`] = cur.filter((x) => x !== s.specialty);
  }
  if (g.humanity) update["system.humanity.value"] = Math.max(0, Math.min(10, (actor.system?.humanity?.value ?? 0) - g.humanity));
  if (g.bloodPotency) update["system.bloodPotency"] = Math.max(0, (actor.system?.bloodPotency ?? 0) - g.bloodPotency);
  if (Object.keys(update).length) await actor.update(update);

  for (const d of g.disciplines ?? []) {
    const disc = actor.items.find((i: any) => i.type === "discipline" && i.system?.discipline === d.key);
    if (disc) await disc.update({ "system.value": Math.max(0, (disc.system?.value ?? 0) - d.dots) });
  }
  await actor.unsetFlag(SYSTEM_ID, "predatorGrants");
}

/**
 * Apply a predator profile's benefits to the actor, resolving the player's
 * choices. Clears any prior predator grant first so it is safe to re-apply or
 * to switch predator types.
 */
export async function applyPredatorGrants(
  actor: any,
  predatorKey: string,
  profile: PredatorProfile,
  choices: PredatorChoices,
  advByName: Map<string, any>,
): Promise<void> {
  await clearPredatorGrants(actor);

  const rec: RecordedGrants = { predator: predatorKey, specialties: [], disciplines: [], humanity: 0, bloodPotency: 0 };
  const skillSpecialties: Record<string, string[]> = {};
  // Aggregate advantage grants by name so e.g. Trapdoor's fixed Haven dot and a
  // pooled Haven dot become one two-dot Haven, not two separate items.
  const advGrants = new Map<string, { kind: string; dots: number }>();
  const grantAdvantage = (name: string, kind: string, dots: number) => {
    const prev = advGrants.get(name);
    if (prev) prev.dots += dots;
    else advGrants.set(name, { kind, dots });
  };

  const benefits = profile.benefits;
  for (let i = 0; i < benefits.length; i++) {
    const b = benefits[i];
    if (!b) continue;
    const choice = choices[i];
    if (b.kind === "specialty") {
      const opt = b.options[typeof choice === "number" ? choice : 0] ?? b.options[0];
      if (!opt) continue;
      const cur = skillSpecialties[opt.skill] ?? [...(actor.system?.skills?.[opt.skill]?.specialties ?? [])];
      if (!cur.includes(opt.specialty)) cur.push(opt.specialty);
      skillSpecialties[opt.skill] = cur;
      rec.specialties.push({ skill: opt.skill, specialty: opt.specialty });
    } else if (b.kind === "discipline") {
      const key = b.options[typeof choice === "number" ? choice : 0] ?? b.options[0];
      if (!key) continue;
      rec.disciplines.push({ key, dots: b.dots });
    } else if (b.kind === "advantage") {
      grantAdvantage(b.name, b.advKind, b.dots);
    } else if (b.kind === "advantageChoice") {
      const opt = b.options[typeof choice === "number" ? choice : 0] ?? b.options[0];
      if (!opt) continue;
      grantAdvantage(opt.name, b.advKind, opt.dots);
    } else if (b.kind === "pool") {
      const alloc: Record<string, number> = choice ?? {};
      for (const name of b.among) {
        const dots = Number(alloc[name] ?? 0);
        if (dots > 0) grantAdvantage(name, b.advKind, dots);
      }
    } else if (b.kind === "trait") {
      rec[b.trait] += b.delta;
    }
  }

  const newItems = [...advGrants.entries()].map(([name, g]) =>
    makeAdvantage(name, g.kind, Math.min(5, g.dots), advByName),
  );

  const update: Record<string, unknown> = {};
  for (const [skill, list] of Object.entries(skillSpecialties)) update[`system.skills.${skill}.specialties`] = list;
  if (rec.humanity) update["system.humanity.value"] = Math.max(0, Math.min(10, (actor.system?.humanity?.value ?? 0) + rec.humanity));
  if (rec.bloodPotency) update["system.bloodPotency"] = Math.max(0, (actor.system?.bloodPotency ?? 0) + rec.bloodPotency);
  if (Object.keys(update).length) await actor.update(update);

  for (const d of rec.disciplines) await addDisciplineDots(actor, d.key, d.dots);
  if (newItems.length) await actor.createEmbeddedDocuments("Item", newItems);

  await actor.setFlag(SYSTEM_ID, "predatorGrants", rec);
}
