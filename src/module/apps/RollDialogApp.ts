/**
 * The V5 pool-builder dialog. A small ApplicationV2 that mounts a Svelte form so
 * the player can assemble a pool (attribute + skill + modifiers), set Hunger and
 * difficulty, optionally Blood Surge, and roll. On submit it rolls, posts the
 * chat card, and closes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { mount, unmount } from "svelte";
import RollDialog from "../sheets/RollDialog.svelte";
import { rollPool } from "../dice/roll-v5.ts";
import { postRollCard, rollCardHTML } from "../dice/chat.ts";
import type { WeaponRollInfo } from "../dice/chat.ts";
import { rouseCheck, bloodSurgeBonus } from "../dice/checks.ts";
import { resolvePool } from "../dice/pool.ts";
import { getSetting, SETTINGS } from "../settings.ts";
import { routeRequestUpdate } from "../dice/request.ts";
import type { RequestPoolSpec } from "../dice/request-types.ts";
import { label } from "../components/labels.ts";

export interface RollSeed {
  attribute?: string;
  skill?: string;
  /** Preselect a Discipline (by key) to add the actor's dots to the pool. */
  discipline?: string;
  /**
   * A Discipline (by key) that the roll *uses* but whose dots are already baked
   * into `fixedPool` — drives the Resonance die bonus without double-counting
   * dots. Set for power rolls that resolve their own written pool.
   */
  resonanceFor?: string;
  flavor?: string;
  difficulty?: number;
  /** A pre-resolved base pool (e.g. a power's dice pool), added before pickers. */
  fixedPool?: number;
  /** Human label for a pre-resolved base pool. */
  poolLabel?: string;
  /** ChatMessage id of the request card this roll fulfils, if any. */
  requestMessageId?: string;
  /** When set, the difficulty is seeded read-only (Storyteller-controlled). */
  lockDifficulty?: boolean;
  /** Pre-seeded flat modifier (e.g. a request's flat pool modifier). */
  modifier?: number;
  /** The pool the request asked for, used to compute a deviation note. */
  requestedPool?: RequestPoolSpec;
  /** Weapon context: a winning roll shows damage + an Apply Damage button. */
  weapon?: WeaponRollInfo;
}

const AppV2 = foundry.applications.api.ApplicationV2;

export class RollDialogApp extends AppV2 {
  static DEFAULT_OPTIONS = {
    id: "gl-roll-dialog",
    classes: ["gluniverse-wod", "gl-roll-dialog-app"],
    position: { width: 460, height: "auto" as const },
    window: { title: "Roll Dice Pool", resizable: false },
  };

  _actor: any;
  _seed: RollSeed;
  _svelte: any = null;

  constructor(actor: any, seed: RollSeed = {}, options: Record<string, unknown> = {}) {
    super(options);
    this._actor = actor;
    // Seed an unset difficulty from the client's preferred default (0 = none:
    // the card just reports successes).
    this._seed = { difficulty: getSetting(SETTINGS.defaultDifficulty, 0), ...seed };
  }

  async _renderHTML(): Promise<null> {
    return null;
  }

  _replaceHTML(_result: unknown, content: HTMLElement): void {
    if (this._svelte) return;
    const target: HTMLElement =
      content?.matches?.(".window-content") ? content
      : (content?.querySelector?.(".window-content") as HTMLElement) ?? content;
    this._svelte = mount(RollDialog, {
      target,
      props: {
        actor: this._actor,
        seed: this._seed,
        onroll: (o: RollDialogResult) => this._doRoll(o),
        oncancel: () => this.close(),
      },
    });
  }

  async _doRoll(o: RollDialogResult): Promise<void> {
    let pool = o.pool;
    if (o.bloodSurge) {
      pool += bloodSurgeBonus(this._actor.system.bloodPotency ?? 0);
      await rouseCheck(this._actor, { label: "Blood Surge — Rouse" });
    }
    const { result, roll } = await rollPool({ pool, hunger: o.hunger, difficulty: o.difficulty });

    const seed = this._seed;
    const fromRequest = !!seed.requestMessageId;
    // A request pins a specific attribute+skill; note when the player rolled
    // something else. Discipline is an additive option, so it never deviates.
    const deviation = computeDeviation(seed.requestedPool, o);

    const message = await postRollCard(this._actor, result, roll, {
      flavor: o.flavor,
      bloodSurge: o.bloodSurge,
      requestMessageId: seed.requestMessageId,
      deviation,
      forcePublic: fromRequest,
      weapon: seed.weapon,
    });

    if (fromRequest) {
      await routeRequestUpdate({
        type: "requestFulfilled",
        requestMessageId: seed.requestMessageId!,
        actorUuid: this._actor.uuid,
        result,
        resultMessageId: message?.id,
        deviation,
      });
    }

    await this.close();
  }

  async _onClose(options: unknown): Promise<void> {
    if (this._svelte) {
      unmount(this._svelte);
      this._svelte = null;
    }
    await super._onClose?.(options);
  }
}

export interface RollDialogResult {
  pool: number;
  hunger: number;
  difficulty: number;
  flavor: string;
  bloodSurge: boolean;
  /** Chosen attribute key, for request pool-deviation detection. */
  attribute?: string;
  /** Chosen skill key, for request pool-deviation detection. */
  skill?: string;
  /** Chosen discipline key (additive option — never counts as deviation). */
  discipline?: string;
}

/**
 * Human note when the rolled attribute/skill differs from what the request
 * asked for, e.g. "requested Wits + Awareness, rolled Wits + Intimidation".
 * A discipline change is an additive option and does NOT count as deviation.
 */
function computeDeviation(
  requested: RequestPoolSpec | undefined,
  chosen: RollDialogResult,
): string | undefined {
  if (!requested) return undefined;
  const reqAttr = requested.attribute ?? "";
  const reqSkill = requested.skill ?? "";
  const gotAttr = chosen.attribute ?? "";
  const gotSkill = chosen.skill ?? "";
  if (reqAttr === gotAttr && reqSkill === gotSkill) return undefined;

  const fmt = (attr: string, skill: string): string =>
    [attr && label("Attributes", attr), skill && label("Skills", skill)]
      .filter(Boolean)
      .join(" + ") || "—";

  return `requested ${fmt(reqAttr, reqSkill)}, rolled ${fmt(gotAttr, gotSkill)}`;
}

/** Convenience: open the pool dialog for an actor, seeded from a clicked trait. */
export function openRollDialog(actor: any, seed: RollSeed = {}): void {
  new RollDialogApp(actor, seed).render(true);
}

/**
 * Roll a Discipline power: resolve its written pool ("Resolve + Auspex") against
 * the actor into a base number, then open the dialog seeded with that pool so the
 * player can still add Hunger, difficulty, specialties or a Blood Surge.
 */
export function rollPower(actor: any, power: any): void {
  const poolStr: string = power?.system?.pool ?? "";
  if (poolStr) {
    const { total } = resolvePool(actor, poolStr);
    openRollDialog(actor, {
      fixedPool: total,
      poolLabel: poolStr,
      flavor: power.name,
      resonanceFor: power?.system?.discipline,
    });
  } else {
    // No written pool: seed the power's Discipline so its dots are added.
    openRollDialog(actor, { discipline: power?.system?.discipline, flavor: power.name });
  }
}

/**
 * Roll a weapon attack: resolve its written pool ("Strength + Brawl") against the
 * actor into a base number; with no written pool, open a blank dialog so the
 * player builds the attack pool themselves.
 */
export function rollWeapon(actor: any, weapon: any): void {
  const poolStr: string = weapon?.system?.pool ?? "";
  // Thread the weapon's mechanics into the roll so the resulting card can offer
  // the V5 damage summary + Apply Damage flow.
  const info: WeaponRollInfo = {
    id: weapon?.id,
    name: weapon?.name ?? "Weapon",
    damage: Math.max(0, weapon?.system?.damage ?? 0),
    damageType:
      weapon?.system?.damageType === "aggravated" ? "aggravated" : "superficial",
  };
  if (poolStr) {
    const { total } = resolvePool(actor, poolStr);
    openRollDialog(actor, {
      fixedPool: total,
      poolLabel: poolStr,
      flavor: weapon.name,
      weapon: info,
    });
  } else {
    openRollDialog(actor, { flavor: weapon.name, weapon: info });
  }
}

/** Roll a bare Discipline: open the dialog with that Discipline's dots added. */
export function rollDiscipline(actor: any, discipline: any): void {
  openRollDialog(actor, {
    discipline: discipline?.system?.discipline,
    flavor: discipline?.name,
  });
}

// Re-export so the sheet can preview a card without a full roll (unused stub kept
// intentionally minimal for now).
export { rollCardHTML };
