/**
 * Resolve a written dice-pool string (as stored on powers, rituals and weapons)
 * into a real number against an actor. A pool like "Resolve + Auspex" is split
 * on "+", each token matched to an Attribute, a Skill, or a Discipline the actor
 * owns, and summed. Unknown tokens contribute 0 but are reported so the roll
 * dialog can show what was and wasn't understood.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ATTRIBUTE_KEYS, SKILL_KEYS, DISCIPLINES } from "../config.ts";
import { label, prettify } from "../components/labels.ts";

export interface PoolPart {
  token: string;
  kind: "attribute" | "skill" | "discipline" | "unknown";
  key?: string;
  value: number;
}

export interface ResolvedPool {
  total: number;
  parts: PoolPart[];
}

/** Discipline rating from the actor's owned Discipline items (0 if not owned). */
export function disciplineRating(actor: any, discipline: string): number {
  let best = 0;
  for (const it of actor.items ?? []) {
    if (it.type === "discipline" && it.system?.discipline === discipline) {
      best = Math.max(best, it.system?.value ?? 0);
    }
  }
  return best;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

/** Build a normalized-name → key index for a group, using localized labels too. */
function index(keys: readonly string[], group: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const k of keys) {
    m.set(norm(k), k);
    m.set(norm(prettify(k)), k);
    m.set(norm(label(group, k)), k);
  }
  return m;
}

/** Resolve `poolStr` against `actor`. */
export function resolvePool(actor: any, poolStr: string): ResolvedPool {
  const attrIdx = index(ATTRIBUTE_KEYS, "Attributes");
  const skillIdx = index(SKILL_KEYS, "Skills");
  const discIdx = index(DISCIPLINES, "Disciplines");
  const sys = actor.system ?? {};

  const parts: PoolPart[] = [];
  for (const raw of String(poolStr ?? "").split(/[+/]/)) {
    const token = raw.trim();
    if (!token) continue;
    const key = norm(token);
    if (attrIdx.has(key)) {
      const k = attrIdx.get(key)!;
      parts.push({ token, kind: "attribute", key: k, value: sys.attributes?.[k]?.value ?? 0 });
    } else if (skillIdx.has(key)) {
      const k = skillIdx.get(key)!;
      parts.push({ token, kind: "skill", key: k, value: sys.skills?.[k]?.value ?? 0 });
    } else if (discIdx.has(key)) {
      const k = discIdx.get(key)!;
      parts.push({ token, kind: "discipline", key: k, value: disciplineRating(actor, k) });
    } else {
      parts.push({ token, kind: "unknown", value: 0 });
    }
  }

  const total = parts.reduce((n, p) => n + p.value, 0);
  return { total, parts };
}
