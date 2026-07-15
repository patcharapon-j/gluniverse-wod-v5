# Chat Card Redesign - Design QA

- Source visual truth: approved Option 3 art-led chat-card direction.
- Implementation evidence: dark, light, and narrow-sidebar browser renders reviewed during implementation.
- Viewports: 440 x 500 (dark and light), 340 x 560 (narrow sidebar)
- State: Messy Critical pool roll with actor art, five dice, Compulsion, Willpower re-roll, and collapsed dice breakdown

## Full-view comparison evidence

The selected mock and browser-rendered implementation were opened together in one comparison pass. The implementation preserves the selected composition: nocturnal full-width actor tableau, identity at upper left, verdict over the lower art edge, inset dark dice table, restrained metadata, and focused footer actions. The dark implementation matches the target's proportions and reading order; light mode intentionally changes only the mechanics surface to parchment, as established during the design interview.

## Focused-region comparison evidence

The complete card is already a 390px component-scale focused view, so a separate crop was unnecessary. Typography, actor crop, result seam, individual dice faces, metadata, disclosure, and buttons were all legible at native scale. A separate 340px capture verified the narrow responsive state.

## Required fidelity surfaces

- Fonts and typography: Cormorant Garamond, Oswald, and Barlow remain the production type system. Display name, outcome stamp, metadata, and action hierarchy match the selected target. Long outcome text remains on one line at narrow width.
- Spacing and layout rhythm: hero, verdict, dice table, metadata, and actions follow the target proportions. The dice table uses border-box sizing and inset gutters; action buttons stack at narrow widths.
- Colors and visual tokens: dark header/art stage is stable in both themes. The mechanics body follows the system light/dark tokens. Blood, gold, bone, and ink semantics remain intact.
- Image quality and asset fidelity: live actor artwork supplies both the atmospheric backdrop and sharp foreground crop. Missing or broken artwork falls back to a deliberate text-only dark header without a placeholder silhouette.
- Copy and content: existing dynamic actor, roll, difficulty, outcome, and action copy is preserved. The disclosure label is clarified to “Dice breakdown.”
- Accessibility and behavior: semantic buttons/details remain intact, focus behavior is not overridden, reduced-motion handling remains active, and the narrow layout avoids horizontal overflow. Browser console errors/warnings: none.

## Comparison history

### Pass 1

- P2: sender and timestamp collapsed in the standalone rendering.
- P2: dice strip was full-bleed instead of the selected inset table.
- P2: Messy outcome grading obscured too much of the portrait.
- Fixes: enforced header flex layout and metadata typography; inset the dice table; softened the outcome tint and brightened the subject.

### Pass 2

- P2: actor name was optically larger than the selected mock.
- P2: dice table used content-box sizing and became too tall.
- Fixes: capped the display name at 28px and switched the dice table to border-box sizing.

### Pass 3

- P2: “Messy Critical” wrapped awkwardly at a 340px viewport.
- Fix: reduced narrow outcome type size/spacing and prevented the stamp from wrapping.

### Pass 4

- No actionable P0/P1/P2 differences remain.
- Expected deviation: the production Hunger critical die is blood red rather than the mock's gold chip because preserving the established V5 Hunger-die semantics is more important than reproducing that mock-data inconsistency.

## Primary interactions tested

- Action controls render enabled with their existing `data-gl-action` contracts.
- Dice breakdown remains a native keyboard-accessible disclosure.
- Willpower selection, damage, Compulsion, and request handlers were not altered; TypeScript and Svelte validation passed. Full click-through mutation still requires the Foundry runtime and is retained as a runtime smoke-test gap.

## Findings

No remaining P0, P1, or P2 design findings.

## Follow-up polish

- Actor-level X, Y, and scale framing is implemented with an accurate chat-card preview.

final result: passed
