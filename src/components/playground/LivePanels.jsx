import { useState } from "react";
import { ChevronDown, Braces, CircleHelp } from "lucide-react";
import { Panel } from "../UI.jsx";
import { formatNumber } from "../visualization/visualModel.js";
const metricLabels = {
  comparisons: "Comparisons",
  swaps: "Swaps",
  writes: "Array writes",
  bufferWrites: "Buffer writes",
  iterations: "Search iterations",
  elementsProcessed: "Elements processed",
  bestUpdates: "Best-sum updates",
  steps: "Execution step",
};
export function resultText(result) {
  if (Array.isArray(result)) return `Sorted array: [${result.join(", ")}]`;
  if (result && "found" in result)
    return result.found
      ? `Found ${result.target} · leftmost matching index ${result.index}`
      : `Target ${result.target} was not found.`;
  if (result && "sum" in result)
    return `Maximum sum ${formatNumber(result.sum)} · subarray [${result.subarray.map(formatNumber).join(", ")}] · ${result.start === null ? "empty input" : `indices ${result.start}…${result.end}`}`;
  return "";
}
export function Statistics({ algorithm, snapshot }) {
  return (
    <Panel title="Execution statistics" eyebrow="LIVE / SNAPSHOT">
      <dl className="metrics-grid">
        {algorithm.supportedMetrics.map((metric) => (
          <div key={metric} data-testid={`metric-${metric}`}>
            <dt>{metricLabels[metric] || metric}</dt>
            <dd>{snapshot ? formatNumber(snapshot.metrics[metric]) : "—"}</dd>
          </div>
        ))}
      </dl>
      {algorithm.id === "kadane" && (
        <dl className="variable-sums">
          <div>
            <dt>Current sum</dt>
            <dd>{formatNumber(snapshot?.variables.currentSum)}</dd>
          </div>
          <div>
            <dt>Best sum</dt>
            <dd>{formatNumber(snapshot?.variables.bestSum)}</dd>
          </div>
        </dl>
      )}
    </Panel>
  );
}
export function PseudocodePanel({ algorithm, snapshot }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <section className="panel pseudocode-panel">
      <header className="panel-heading">
        <h2>Live pseudocode</h2>
        <button
          className="panel-toggle"
          aria-label={expanded ? "Collapse pseudocode" : "Expand pseudocode"}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <Braces size={15} />
          <ChevronDown size={14} />
        </button>
      </header>
      <ol
        className="pseudocode-list"
        hidden={!expanded}
        aria-label={`${algorithm.name} pseudocode`}
      >
        {algorithm.pseudocode.map((line, index) => (
          <li
            key={line.id}
            aria-current={
              snapshot?.pseudocodeLine === index + 1 ? "step" : undefined
            }
          >
            <span className="code-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <code>
              <span className="code-keyword">{line.text.split(" ")[0]}</span>
              {line.text.slice(line.text.indexOf(" "))}
            </code>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function ExplanationPanel({ snapshot, error, dirty }) {
  return (
    <Panel title="What's happening?" eyebrow={<CircleHelp size={16} />}>
      <div className="explanation">
        <span className="operation-badge" aria-label="Current operation">
          {snapshot?.operation || "validation"}
        </span>
        <p aria-label="Current explanation">
          {error
            ? `Execution is unavailable: ${error}`
            : snapshot?.explanation || "Choose valid input to begin."}
        </p>
        {dirty && (
          <p className="draft-notice">
            Edits are not applied. The canvas still shows the last committed
            execution.
          </p>
        )}
        {snapshot?.status === "complete" && (
          <div className="algorithm-result" aria-label="Algorithm result">
            <strong>Completed</strong>
            <p>{resultText(snapshot.result)}</p>
          </div>
        )}
        {snapshot && Object.keys(snapshot.variables).length > 0 && (
          <details className="variables-details" open>
            <summary>Variables & pointers</summary>
            <dl>
              {Object.entries({
                ...snapshot.variables,
                ...snapshot.pointers,
              }).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value === null ? "—" : String(value)}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </div>
    </Panel>
  );
}
export function ComplexityPanel({ algorithm }) {
  const [expanded, setExpanded] = useState(false);
  const c = algorithm.complexity;
  return (
    <section className="panel complexity-panel">
      <header className="panel-heading">
        <h2>Complexity</h2>
        <button
          className="panel-toggle"
          aria-label={
            expanded
              ? "Collapse complexity details"
              : "Expand complexity details"
          }
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <ChevronDown size={15} />
        </button>
      </header>
      <dl className="complexity-summary">
        <div>
          <dt>Worst time</dt>
          <dd>{c.worst}</dd>
        </div>
        <div>
          <dt>Generator space</dt>
          <dd>{c.auxiliarySpace}</dd>
        </div>
      </dl>
      <div className="complexity-detail" hidden={!expanded}>
        <dl>
          <div>
            <dt>Best time</dt>
            <dd>{c.best}</dd>
          </div>
          <div>
            <dt>Average time</dt>
            <dd>{c.average}</dd>
          </div>
          <div>
            <dt>Core auxiliary space</dt>
            <dd>{c.coreAuxiliarySpace}</dd>
          </div>
        </dl>
        <p>{c.notes}</p>
      </div>
      <p className="runtime-note">
        Core operation complexity. Generator space includes the input copy;
        snapshot caching adds memory. Playback duration is not algorithm
        runtime.
      </p>
    </section>
  );
}
