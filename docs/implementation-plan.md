# Itera: Phases 1 and 2

Scope follows the supplied development brief. Implement a browser-only React shell and framework-independent engine; stop before algorithm implementation.

- [x] Foundation: Vite/React/Tailwind/Motion/Lucide, design tokens, responsive navigation, reusable controls, persistent dark/light theme.
- [x] Engine tests first: immutable deep snapshots; strict input validation; deterministic presets; generator registry; cached backward navigation; play/pause/restart/end/seek; speed replacement; cancellation and disposal.
- [x] Implement the engine against those tests. Cache at most 20,000 snapshots and limit arrays to 48 integers in [-999,999]. Reject overflow explicitly.
- [x] Connect input editing and an honest preparation screen. No production algorithm or simulated execution in these phases.
- [x] Run tests, lint and build; document architecture, metric definitions, limits, and remaining phases.

Design: compact left navigation, editorial heading, central SVG input preview, right execution-contract panel, restrained sage accent and structured borders. A test-only generator proves engine behavior without beginning Phase 3. The engine owns a single timeout and cached immutable frames; React subscribes through a separate adapter. Empty arrays are valid engine input. Blank editor input maps explicitly to an empty array.

No commits, pushes, deployment, or later phases.
