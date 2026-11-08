import { useState } from "react";
import { ArrowRight, ArrowLeft, Play, GitCompareArrows } from "lucide-react";
import { algorithmRegistry } from "../engine/algorithmRegistry.js";
import { Button, Panel } from "./UI.jsx";
import { PseudocodePanel, ComplexityPanel } from "./playground/LivePanels.jsx";
const algorithms = algorithmRegistry.list();
export function AlgorithmLibrary({ onInspect, onPlay, onRace }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(algorithms.map((a) => a.category))];
  const matches = algorithms.filter(
    (a) =>
      (category === "All" || a.category === category) &&
      `${a.name} ${a.category} ${a.complexity.average} ${a.complexity.notes}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            // EXPLORE THE ENGINE — ALGORITHM CATALOG
          </span>
          <h1>Explore the algorithms.</h1>
          <p>
            Six approaches. Inspect the procedure, then follow its execution.
          </p>
        </div>
        <span className="registry-count mono">
          {algorithms.length} REGISTERED ALGORITHMS
        </span>
      </div>
      <div className="catalog-filters">
        <input
          aria-label="Filter algorithms"
          placeholder="Filter by name, complexity, or approach…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div
          className="category-filters"
          role="group"
          aria-label="Algorithm category"
        >
          {categories.map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c} (
              {c === "All"
                ? algorithms.length
                : algorithms.filter((a) => a.category === c).length}
              )
            </button>
          ))}
        </div>
      </div>
      <section className="algorithm-catalog" aria-label="Algorithm catalog">
        {matches.map((a) => (
          <article className="algorithm-card" key={a.id}>
            <span className="eyebrow">{a.category}</span>
            <h2>{a.name}</h2>
            <span className="algorithm-id mono">{a.id}</span>
            <dl className="card-complexity">
              <div>
                <dt>Average</dt>
                <dd>{a.complexity.average}</dd>
              </div>
              <div>
                <dt>Worst</dt>
                <dd>{a.complexity.worst}</dd>
              </div>
              <div>
                <dt>Core space</dt>
                <dd>{a.complexity.coreAuxiliarySpace}</dd>
              </div>
            </dl>
            <p>{a.complexity.notes}</p>
            <div className="procedure-preview">
              <span className="tiny-label">PROCEDURE / FIRST INSTRUCTION</span>
              <code>{a.pseudocode[0].text}</code>
            </div>
            <div className="card-actions">
              <Button
                aria-label={`Inspect ${a.name}`}
                icon={ArrowRight}
                onClick={() => onInspect(a.id)}
              >
                Inspect blueprint
              </Button>
              <Button
                aria-label={`Open ${a.name} in Playground`}
                icon={Play}
                onClick={() => onPlay(a.id)}
              >
                Playground
              </Button>
            </div>
          </article>
        ))}
        {!matches.length && (
          <p role="status">No algorithms match your filters.</p>
        )}
      </section>
      <div className="page-callout">
        <div>
          <h2>Same input. Different strategies.</h2>
          <p>Compare two sorting algorithms with one coordinated clock.</p>
        </div>
        <Button variant="primary" icon={GitCompareArrows} onClick={onRace}>
          Launch Race Mode
        </Button>
      </div>
    </>
  );
}
export function AlgorithmDetail({ id, onBack, onPlay }) {
  const algorithm = algorithmRegistry.get(id);
  return (
    <>
      <div className="detail-breadcrumb">
        <Button icon={ArrowLeft} onClick={onBack}>
          Algorithm Library
        </Button>
        <span className="mono">
          {algorithm.category} / {algorithm.id}
        </span>
      </div>
      <div className="page-intro">
        <div>
          <span className="eyebrow">// REGISTRY BLUEPRINT</span>
          <h1>{algorithm.name}</h1>
          <p>{algorithm.complexity.notes}</p>
        </div>
        <Button variant="primary" icon={Play} onClick={() => onPlay(id)}>
          Play in Playground
        </Button>
      </div>
      <div className="detail-grid">
        <PseudocodePanel algorithm={algorithm} />
        <aside className="details-column">
          <ComplexityPanel algorithm={algorithm} />
          <Panel title="Execution contract" eyebrow="REGISTRY">
            <div className="information-body">
              <h3>Input requirements</h3>
              <p>
                0–{algorithm.inputRequirements.maxLength} integers in [
                {algorithm.inputRequirements.min},{" "}
                {algorithm.inputRequirements.max}]. Empty input is supported.
              </p>
              {algorithm.inputRequirements.sorted && (
                <p>
                  Ascending sorted input required. Matches return the leftmost
                  index.
                </p>
              )}
              <h3>Supported counters</h3>
              <p>{algorithm.supportedMetrics.join(" · ")}</p>
              {typeof algorithm.stable === "boolean" && (
                <p>
                  Stable: {algorithm.stable ? "Yes" : "No"}. Core in-place:{" "}
                  {algorithm.inPlaceCore ? "Yes" : "No"}.
                </p>
              )}
              <p>
                Core space and generator space differ. Snapshot caching adds
                memory; playback duration is not execution runtime.
              </p>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
const stages = [
  [
    "01 / PREPARE",
    "Start with your input",
    "Edit an integer array or generate a preset. Inputs stay in memory; your theme preference is saved locally.",
  ],
  [
    "02 / GENERATE",
    "One decision at a time",
    "Independent JavaScript generators yield self-contained, immutable snapshots of algorithm state.",
  ],
  [
    "03 / RETAIN",
    "Revisit the exact state",
    "The playback controller retains up to 20,000 frames without eviction. Step backward or seek through generated frames.",
  ],
  [
    "04 / INSPECT",
    "Connect state to meaning",
    "SVG visualizations, pseudocode, variables and explanations all describe the same selected snapshot.",
  ],
];
export function AboutItera({ onPlay, onRace }) {
  return (
    <div className="about-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">// THE ITERA LABORATORY</span>
          <h1>
            Algorithms aren’t magic.
            <br />
            <em>They’re steps.</em>
          </h1>
          <p>
            Itera makes deterministic execution visible, so you can inspect the
            decisions behind an algorithm.
          </p>
        </div>
      </div>
      <section className="about-section">
        <span className="eyebrow">EXECUTION / FROM INPUT TO UNDERSTANDING</span>
        <h2>The snapshot execution pipeline</h2>
        <p>See the logic. Follow the flow.</p>
        <div className="pipeline-grid">
          {stages.map(([number, title, description]) => (
            <article key={number}>
              <span className="tiny-label">{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="about-section">
        <h2>Learn by following the flow.</h2>
        <div className="principles-grid">
          <Panel title="Playback at your pace">
            <div className="information-body">
              <p>
                Pause, step, rewind and change speed. Inspect exact cached
                states and follow the active pseudocode line.
              </p>
            </div>
          </Panel>
          <Panel title="Two strategies, one input">
            <div className="information-body">
              <p>
                Race Mode coordinates two sorting generators on a shared clock
                and value scale. Compare supported counters separately, without
                a CPU-runtime winner.
              </p>
            </div>
          </Panel>
          <Panel title="Meaning beyond color">
            <div className="information-body">
              <p>
                State labels, pointer names and accessible array tables
                complement visual highlights. Reduced-motion preferences are
                respected live.
              </p>
            </div>
          </Panel>
          <Panel title="A browser-only laboratory">
            <div className="information-body">
              <p>
                Six algorithms, no account required. Execution and input stay in
                memory. Theme preference is the only persisted application
                setting.
              </p>
            </div>
          </Panel>
        </div>
      </section>
      <div className="page-callout">
        <div>
          <h2>Ready to see the next step?</h2>
          <p>Explore one algorithm or compare two sorting strategies.</p>
        </div>
        <Button variant="primary" icon={Play} onClick={onPlay}>
          Launch Playground
        </Button>
        <Button icon={GitCompareArrows} onClick={onRace}>
          Compare in Race Mode
        </Button>
      </div>
    </div>
  );
}
