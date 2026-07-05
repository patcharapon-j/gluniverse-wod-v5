/**
 * Custom system dice. `dv` is the Kindred's regular die, `dh` a Hunger die and
 * `dr` a Rouse die — real DiceTerm subclasses rather than re-themed d10s, so
 * formulas read `3dv + 2dh`, Dice So Nice keys its presets to the die type, and
 * other modules see distinct denominations. All behave as ten-sided dice. The
 * Rouse die is mechanically a Hunger-style die, but gets its own denomination so
 * a Rouse check rolled alongside a pool can never be mistaken for part of it.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const BaseDie: any = (foundry as any).dice.terms.Die;

export class VampireDie extends BaseDie {
  static DENOMINATION = "v";
  constructor(termData: any = {}) {
    super({ ...termData, faces: 10 });
  }
}

export class HungerDie extends BaseDie {
  static DENOMINATION = "h";
  constructor(termData: any = {}) {
    super({ ...termData, faces: 10 });
  }
}

export class RouseDie extends BaseDie {
  static DENOMINATION = "r";
  constructor(termData: any = {}) {
    super({ ...termData, faces: 10 });
  }
}

/** Make the `dv` / `dh` / `dr` denominations parseable in roll formulas. */
export function registerDiceTerms(): void {
  (CONFIG as any).Dice.terms.v = VampireDie;
  (CONFIG as any).Dice.terms.h = HungerDie;
  (CONFIG as any).Dice.terms.r = RouseDie;
}
