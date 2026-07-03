# GLUniverse — World of Darkness V5

A Foundry VTT game system for the World of Darkness 5th Edition line (VtM,
Hunter, Werewolf, etc.), built as one shared system covering every V5 splat.

## Layout

- `system.json` — Foundry manifest (id, version, compatibility, manifest/download URLs).
- `template.json` — Actor/Item data models (mortal, vampire, hunter; skill, power, advantage).
- `src/module/gluniverse-wod.ts` — system entry point (Foundry `init`/`ready` hooks).
- `src/foundry-shim.d.ts` — minimal ambient types; replace with `foundry-vtt-types` when implementing.
- `styles/`, `lang/` — CSS and localization, copied into the build as-is.
- `scripts/update-manifest.mjs` — rewrites `system.json` URLs/version at release time.
- `.github/workflows/release.yml` — manual-trigger release (patch/minor/major).

## Build

`vite build` compiles `src/` and copies `system.json`, `template.json`, `lang/`,
`styles/` into `dist/`, which is the root of the packaged `system.zip`.

## Releasing

Manual only, via the **Release System** GitHub Action. It bumps the version,
rebuilds, tags `vX.Y.Z`, and publishes a Release with `system.json` + `system.zip`.
The manifest URL (`releases/latest/download/system.json`) drives in-place updates.

## Skills

Matt Pocock's [skills](https://github.com/mattpocock/skills) are installed under
`.claude/skills/` (e.g. `grill-me`, `grill-with-docs`, `tdd`, `code-review`).
