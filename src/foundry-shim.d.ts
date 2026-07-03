/**
 * Minimal ambient declarations so the entry point type-checks without pulling
 * in the full Foundry typings yet. These will be replaced by
 * `@league-of-foundry-developers/foundry-vtt-types` once real implementation
 * work begins.
 */
declare const Hooks: {
  once(event: string, cb: (...args: unknown[]) => void): void;
  on(event: string, cb: (...args: unknown[]) => void): void;
};

declare const game: Record<string, unknown> & {
  system?: { id: string; version: string };
};

declare const CONFIG: Record<string, unknown>;
