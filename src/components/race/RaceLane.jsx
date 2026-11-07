import { SnapshotVisualization } from "../visualization/SnapshotVisualization.jsx";
import { Statistics, PseudocodePanel } from "../playground/LivePanels.jsx";
export function RaceLane({ label, lane, input, playing, speed }) {
  if (!lane)
    return (
      <section
        className="panel race-lane"
        aria-label={`Algorithm ${label} lane`}
      >
        <div className="information-body">
          Choose valid sorting algorithms and input to initialize this lane.
        </div>
      </section>
    );
  const { algorithm, snapshot } = lane;
  return (
    <section
      className="panel race-lane"
      aria-label={`Algorithm ${label} lane`}
      data-complete={lane.complete ? "true" : "false"}
    >
      <header className="race-lane-heading">
        <div>
          <span className="tiny-label">ALGORITHM {label}</span>
          <h2>{algorithm.name}</h2>
        </div>
        <span className="lane-status" aria-label="Lane status">
          {lane.status}
        </span>
      </header>
      <div className="canvas-meta">
        <span className="operation-tag" aria-label="Lane operation">
          {snapshot?.operation || "validation"}
        </span>
        <span className="mono">
          Step {lane.index + 1} · {lane.generated}{" "}
          {lane.knownComplete ? "total" : "generated"}
        </span>
      </div>
      {snapshot && (
        <SnapshotVisualization
          algorithm={algorithm}
          snapshot={snapshot}
          scaleValues={input}
          playing={playing && !lane.complete}
          speed={speed}
        />
      )}
      {lane.error && <p className="error race-lane-error">{lane.error}</p>}
      <Statistics algorithm={algorithm} snapshot={snapshot} />
      <div className="lane-complexity">
        <span>
          Worst core time <strong>{algorithm.complexity.worst}</strong>
        </span>
        <span>
          Generator space <strong>{algorithm.complexity.auxiliarySpace}</strong>
        </span>
      </div>
      {snapshot && (
        <details className="race-explanation">
          <summary>
            Follow this lane · pseudocode line {snapshot.pseudocodeLine}
          </summary>
          <p aria-label="Lane explanation">{snapshot.explanation}</p>
          <PseudocodePanel algorithm={algorithm} snapshot={snapshot} />
          {lane.complete && (
            <p className="lane-output">Output [{snapshot.array.join(", ")}]</p>
          )}
        </details>
      )}
    </section>
  );
}
