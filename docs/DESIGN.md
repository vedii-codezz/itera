# Itera Interface Design

**See the logic. Follow the flow.**

[Documentation index](../README.md#documentation) · [Specification](SPEC.md) · [Architecture](ARCHITECTURE.md)

## Direction and status

A calm creative-coding laboratory with editorial typography, legible data, restrained borders and meaningful state indicators. This records the implemented Phase 4 interface as inspected on 2026-11-08; it does not request a redesign. The supplied wireframes below remain design references. Race Mode is planned Phase 5.

## Actual theme tokens

Source: [src/styles.css](../src/styles.css). These replace the supplied proposed light values.

| Role / CSS variable     | Dark      | Light     |
| ----------------------- | --------- | --------- |
| Background / `--bg`     | `#101514` | `#F4F5EF` |
| Surface / `--surface`   | `#19201E` | `#FFFEF8` |
| Elevated / `--elevated` | `#222B27` | `#E7ECE2` |
| Text / `--text`         | `#F1F2EB` | `#202B24` |
| Muted / `--muted`       | `#9CAAA2` | `#5C6D61` |
| Accent / `--accent`     | `#B7D7A8` | `#496C35` |
| Border / `--border`     | `#344039` | `#D2D9CD` |

| Visualization role / variable              | Dark      | Light     |
| ------------------------------------------ | --------- | --------- |
| Default muted blue / `--bar`               | `#7998A5` | `#688B9C` |
| Compare / `--compare`                      | `#E6CD82` | `#9A6A0D` |
| Swap / `--swap`                            | `#DF9380` | `#B14F3B` |
| Sorted, best, match / `--sorted`           | `#B7D7A8` | `#52723F` |
| Active/pointer / `--active`                | `#83D5D7` | `#247B83` |
| Selected range/pivot/prefix / `--selected` | `#C6A66C` | `#9B732E` |

States also use labels, borders, dashed holes/local ranges, pointer rows, legends, explanations and an expandable table. Color alone is not the state contract. A candidate search match is not necessarily the final leftmost answer until completion.

## Typography and components

- Body/UI and main heading: `Arial, Helvetica, sans-serif`; typographic `itera.` logo uses this inherited sans-serif family.
- Emphasized heading text and editorial accents: `Georgia, serif`.
- `.mono`: `"Cascadia Code", Consolas, monospace`; pseudocode and most numeric/SVG labels use Consolas/monospace.
- No external webfont is loaded; do not claim a custom display font or globally configured tabular numerals.
- `Button` and `Panel` are in [UI.jsx](../src/components/UI.jsx). Panels use restrained borders and 7 px radii; controls generally use 5 px radii. Focus-visible outlines use the accent.
- Disabled controls visibly dim; the transport has appropriate disabled states and semantic accessible names. Core transport and panel toggles have larger mobile hit areas; this is not a claim that every control is 44 px.

## Implemented layout and motion

The desktop shell has a compact left navigation and top breadcrumb. Algorithm/category/complexity selection spans the workspace above input/canvas. Input studio, visualization, transport, statistics and shortcuts occupy the main column; explanation, pseudocode and complexity occupy the side column.

| CSS breakpoint  | Implemented adaptation                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| Default desktop | 226 px sidebar; main canvas plus 277 px side panels                                                               |
| ≤1200 px        | 190 px sidebar, tighter spacing and wrapping control layouts                                                      |
| ≤950 px         | Execution panels stack in one column; sidebar still exists                                                        |
| ≤650 px         | Compact top brand/theme and four navigation buttons; stacked controls, touch-sized transport; no hamburger drawer |
| ≥1400 px        | Execution side panels become 310 px                                                                               |
| ≥1600 px        | Additional spacing/large-screen adjustments                                                                       |

SVG sizing uses available container width; small arrays fit while dense arrays retain readable labels in contained horizontal scrolling with a visible hint. Pointer labels stack in separate rows; sentinel labels stay within canvas bounds. Pseudocode and complexity collapse via buttons; variables and snapshot tables use native details. The explanation panel itself is not collapsible.

Geometry and values snap to actual snapshots. Short color transitions run only during timed forward playback, end before the next tick, and stop on pause/manual navigation. CSS plus a live `matchMedia` subscription honors reduced motion. No inferred intermediate sums, fake swaps, or interpolated value movement are used.

## Supplied ASCII wireframes — preserved reference

These conceptual wireframes are not exact current screenshots. In particular, the real input studio is above the canvas, mobile uses four navigation buttons rather than a menu drawer, and the explanation panel is not collapsible. Actual images are linked below. The Race Mode wireframe is proposed only.

### Playground desktop reference

```text
+---------------------------------------------------------------+
| itera.             Playground       Theme / navigation        |
+---------------+---------------------------+-------------------+
| INPUT STUDIO  | ALGORITHM + COMPLEXITY    | PSEUDOCODE        |
| algorithm     +---------------------------+ highlighted line  |
| custom array  |                           +-------------------+
| presets       |  SVG BARS / CELLS / CHART | WHAT'S HAPPENING  |
| randomize     |                           | variables/result  |
| validation    +---------------------------+-------------------+
|               | BACK PLAY NEXT SPEED SEEK | METRICS           |
+---------------+---------------------------+-------------------+
```

### Mobile reference

```text
+--------------------------+
| itera.       menu  theme |
| Algorithm / complexity   |
| Input controls           |
| SVG canvas (scrollable)  |
| Playback + seek + speed  |
| Metrics                  |
| [Pseudocode v]           |
| [Explanation v]          |
+--------------------------+
```

### Race Mode reference — planned

```text
+---------------------------------------------------------------+
| Race Mode | same input | algorithm A | algorithm B | speed    |
+-----------------------------+---------------------------------+
| Algorithm A SVG             | Algorithm B SVG                 |
| metrics A                   | metrics B                       |
+-----------------------------+---------------------------------+
| START / PAUSE / RESTART | comparison mode                    |
| Result summary: comparisons / writes / swaps / steps          |
+---------------------------------------------------------------+
```

On mobile, the proposed Race Mode lanes would stack vertically. This is not an implemented screen.

## Evidence and remaining design work

Actual Phase 4 screenshots: [desktop](media/phase4-desktop.png) and [mobile](media/phase4-mobile.png). Their existence is verified; the current documentation task does not claim a new browser/visual session. Historical Chrome desktop/mobile and live preference checks are in [verification.md](verification.md).

TODO: perform a screen-reader session, broader contrast/accessibility audit, Safari/Firefox checks, and physical-device testing. Keyboard shortcuts and their reference already exist. No WCAG conformance level or cross-browser certification is claimed. Any Race Mode layout refinement requires a separately approved Phase 5 task.
