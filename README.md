# GLUniverse — World of Darkness V5

A modern, unofficial [Foundry VTT](https://foundryvtt.com/) game system for the
**World of Darkness 5th Edition** family of games — Vampire: The Masquerade,
Hunter: The Reckoning, Werewolf, and beyond — built on a single shared
foundation so every V5 splat runs on one system.

> **Status:** early setup. Project scaffolding, build tooling, and the release
> pipeline are in place. Data models, character sheets, and dice mechanics land
> in later implementation work.

## Install / Update in Foundry

Install with the **manifest link** (Foundry → _Game Systems_ → _Install System_
→ paste into _Manifest URL_):

```
https://github.com/patcharapon-j/gluniverse-wod-v5/releases/latest/download/system.json
```

This URL always resolves to the latest release, so Foundry can detect and apply
updates in place.

## Development

Requires Node.js 20+.

```bash
npm install      # install dependencies
npm run build    # build into dist/
npm run watch    # rebuild on change
npm run typecheck
```

The build assembles a Foundry-ready package in `dist/`:

```
dist/
├── system.json
├── template.json
├── module/gluniverse-wod.js
├── styles/gluniverse-wod.css
└── lang/en.json
```

To develop against a live Foundry install, symlink `dist/` (or a build watch
target) into your Foundry `Data/systems/gluniverse-wod-v5` folder.

## Releasing

Releases are **manual-trigger only**. In GitHub → _Actions_ → **Release System**
→ _Run workflow_, pick a bump type:

- **patch** — backwards-compatible fixes (`0.1.0 → 0.1.1`)
- **minor** — new features (`0.1.0 → 0.2.0`)
- **major** — breaking changes (`0.1.0 → 1.0.0`)

The workflow then:

1. Bumps the version in `package.json` and `system.json`.
2. Repoints the manifest/download URLs at the new release.
3. Builds and packages `system.zip`.
4. Commits the version bump and tags `vX.Y.Z`.
5. Publishes a GitHub Release with `system.json` and `system.zip` attached.

Because `manifest` points at `releases/latest/download/system.json`, existing
installs are offered the update automatically.

## Legal

Code is licensed under the [MIT License](LICENSE).

This is an **unofficial, fan-made** system and is not affiliated with or
endorsed by Paradox Interactive or White Wolf. _World of Darkness_, _Vampire:
The Masquerade_, _Hunter: The Reckoning_, and related properties are trademarks
of Paradox Interactive AB. This project ships no copyrighted game text; it is a
mechanical toolset intended to be used alongside the official rulebooks, and is
made in accordance with Paradox's community content policy (the "Dark Pack").
