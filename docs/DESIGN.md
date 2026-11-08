# Itera Interface Design

**See the logic. Follow the flow.**

[Documentation index](../README.md#documentation) · [Specification](SPEC.md) · [Architecture](ARCHITECTURE.md)

## Phase 5.5 design system

The supplied Stitch PNGs guide the workbench composition: compact horizontal navigation, editorial headers, full-width input and live counters, a large canvas with a side inspector, paired race lanes, and registry catalog cards. HTML supports layout interpretation; it is not embedded or copied as a standalone app. Existing React components remain connected to real snapshots.

### Canonical palette

| Brand token | Exact value |
| --- | --- |
| Black | `#0B0B0E` |
| Mint | `#9FD5C8` |
| Red | `#A01F2D` |
| Milky | `#F1EDE6` |
| Flashlight | `#B76CDE` |
| Silver | `#C8CDD2` |

Source: [styles.css](../src/styles.css). Brand values stay constant across themes. Semantic text variants provide contrast.

| Semantic role | Dark | Light |
| --- | --- | --- |
| Background | Black | Milky |
| Surface | `#151519` | `#FFFEFB` |
| Elevated | `#202025` | `#E6E2DB` |
| Text | Milky | Black |
| Secondary text | Silver | `#505058` |
| Interaction text | Mint | `#236456` |
| Comparison/pointer text | Flashlight | `#79359E` |
| Error text | `#F0A6AF` | Red |
| Border | `#39393F` | `#C3BFB9` |

Default visualization elements use Silver; comparisons/pointers use Flashlight, swaps use Red, final/best/match uses Mint, and pivot/key/selected ranges use Mint with border distinctions. Light semantic state variants darken Mint and Flashlight for legibility. Translucent derived fills retain fine state-colored borders. Pivots have dashed borders; labels, pointer names, legends, explanations and accessible array tables preserve meaning beyond color. Error prose uses the separate accessible error-text token.

### Contrast checks

Calculated WCAG contrast ratios from the actual token values: Milky/Black 16.84:1, Black/Mint 12.00:1, Black/Flashlight 5.82:1, dark error/surface 9.35:1, Red/light surface 7.63:1, light secondary/Milky 6.84:1, light interaction/Milky 5.94:1, light comparison/Milky 6.39:1. Text on Flashlight uses Black rather than Milky. These token calculations do not constitute a complete screen-reader or accessibility audit.

### Typography

Self-hosted open fonts in `public/fonts/` match the references: Space Grotesk (500/600) for headings, Geist (400/500/600) for UI, JetBrains Mono (400/500) for code and counters. Each font's OFL license is included. `font-display: swap` and system fallbacks preserve usable first rendering. No font package or runtime font CDN is required. Metrics use tabular numerals.

### Shared components and layout

Existing `Button`, `Panel`, `InputStudio`, `PlaybackControls`, `Statistics`, `PseudocodePanel`, `ExplanationPanel`, `ComplexityPanel`, snapshot renderers and race components are reused. `InformationPages.jsx` adds registry-only catalog/detail presentation and an accurate About pipeline. There is no new execution engine, route library, or independent theme state.

- Fixed 64px desktop header, horizontal navigation and a theme toggle. Existing in-memory page navigation remains authoritative.
- Playground input spans the workspace; counters precede a canvas/inspector grid (roughly 68/32). Below 850px the inspector stacks after the canvas.
- Input generation wraps below 1100px. At 650px and below, bottom navigation uses safe-area padding and reserves space below content. Controls wrap rather than clip.
- Race lanes remain equal-width on desktop and stack vertically on mobile, consuming the existing shared scale. Shared transport appears below the lanes.
- Catalog uses three/two/one columns. Filters wrap; all cards open details or the selected existing Playground algorithm.
- Dense arrays use native contained horizontal scrolling. Small arrays fit at the standard 390px viewport. The existing 320px minimum SVG may scroll within the canvas at narrower sizes.
- Pseudocode/complexity retain collapse controls; array tables and variables retain native details.

### Accessibility and motion

Semantic buttons/selects, skip-to-workspace link, visible focus rings, navigation `aria-current`, filter `aria-pressed`, labels and disabled states remain. Navigation focuses the main workspace. Primary controls use 44px targets; range controls retain native keyboard behavior. Explanation text no longer announces every playback frame; the execution status announces state changes. Existing live reduced-motion detection and timer ownership are unchanged.

### Reference inventory and deviations

Both ZIPs include a PNG and HTML for each screen: desktop Playground, Race, Library, Detail and About in dark/light; mobile Playground, Race, Library and Detail in dark/light. The duplicate `itera_lab/DESIGN.md` is reference material. No About mobile reference or bundled font/image files were supplied. Desktop brand images appear broken in the PNGs; Itera uses its existing icon library and typographic brand.

Mobile light references are visibly dark: actual light tokens take precedence. Unsupported algorithms, dual-pivot claims, account/global search chrome, certification, CPU benchmarks, invented runtime/worker architecture, and mock metrics are omitted. Registry detail shows only existing metadata/pseudocode and opens the real Playground; it does not duplicate a sandbox. Catalog previews show real first instructions instead of invented static execution diagrams. No decorative gradients are added. Phase 6 educational content remains deferred.

## Supplied ASCII wireframes — preserved reference

These conceptual wireframes are not exact current screenshots. In particular, the real input studio is above the canvas, mobile uses four navigation buttons rather than a menu drawer, and the explanation panel is not collapsible. Actual images are linked below. The Race Mode wireframe is a structural reference for the implemented screen, not an exact layout.

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

### Race Mode reference — implemented structural reference

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

The implemented Race Mode stacks lanes at 1100 px and below. The wireframe remains an approximate structural reference, not an exact screenshot.

## Evidence and remaining design work

Actual Phase 4 screenshots: [desktop](media/phase4-desktop.png) and [mobile](media/phase4-mobile.png). Their existence is verified; the current documentation task does not claim a new browser/visual session. Historical Chrome desktop/mobile and live preference checks are in [verification.md](verification.md).

TODO: perform a screen-reader session, broader contrast/accessibility audit, Safari/Firefox checks, and physical-device testing. Keyboard shortcuts and their reference already exist. No WCAG conformance level or cross-browser certification is claimed. Further layout refinements or Phase 6 changes require a separately approved task.

## Race Mode (Phase 5)

Algorithm A/B selectors lead, followed by the shared InputStudio, mode buttons, transport/timeline, dual lanes and a partial/final comparison summary. A small typographic `vs.` uses the existing Georgia/accent treatment. The desktop pair stacks at 1100 px, leaving visualization-local scrolling for dense arrays. No new palette, webfont, leaderboard, confetti or decorative timing rank was introduced.

Each lane reuses SnapshotVisualization, Statistics and registry PseudocodePanel. Compact details are collapsed by default; operation/status and counters remain visible. `scaleValues` fixes both sorting renderers to the same initial input domain, including insertion keys held outside the array. Light and dark styles use the existing tokens. Only shared status transitions are live announcements, not every tick/counter. Mode buttons expose pressed state; native scroll keys, visible focus and reduced motion remain intact.

Actual Race Mode screenshots: [desktop/light](media/phase5-desktop.png), [mobile/dark](media/phase5-mobile.png). Browser viewport checks and source-level accessibility support do not constitute physical-device, screen-reader or WCAG certification; broader audits remain future work.
