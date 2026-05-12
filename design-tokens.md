# Design Tokens

This project keeps visual primitives in `src/app/globals.css` and avoids encoding design decisions directly in JSX.

## Use these primitives first

- Color tokens: `--canvas`, `--paper`, `--muted`, `--accent`, semantic text tokens, and status tokens.
- Surface classes: `surface-card`, `surface-panel`, `surface-hero`, `surface-form`, `surface-item`.
- Layout classes: `layout-form-shell`, `layout-result-hero`, `layout-verdict`, `layout-two-even`, and `layout-collection-*`.
- Typography classes: `eyebrow`, `title-hero`, `title-section`, `title-verdict`, `body-copy`, `card-kicker`.
- Controls: `pill-accent`, `pill-muted`, `pill-low-confidence`, `field-input`, `action-button`.
- Feedback: `status-danger`, `status-warning`, `source-link`, `divider-muted`.

## Rules

- Do not add one-off `rgba(...)`, hex colors, shadows, or radii in component markup unless the primitive layer cannot express the requirement.
- Prefer semantic classes over repeating raw token-based utility strings, opacity variants, or uppercase tracking utilities.
- If a new visual pattern appears in more than one place, promote it into `globals.css` before reusing it.
- Keep error, warning, and success states semantic. Add tokens/classes for them instead of using raw Tailwind color utilities inline.

## Current intent

- `surface-*` classes define containers and panel treatments.
- typography classes define reading hierarchy and tone.
- token values can change, but component markup should stay largely stable.
