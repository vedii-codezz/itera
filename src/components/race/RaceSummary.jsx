import { buildRaceComparison } from "../../race/raceComparison.js";
const format = (value) =>
  value === null ? "— not used / unavailable" : String(value);
export function RaceSummary({ state }) {
  const { partial, rows, observations } = buildRaceComparison(state);
  return (
    <section
      className="panel race-summary"
      data-final={state.complete ? "true" : "false"}
      aria-label="Race comparison summary"
    >
      <header className="panel-heading">
        <h2>Comparison summary</h2>
        <span className="mono" aria-label="Comparison summary status">
          {partial ? "Partial results" : "Final results"}
        </span>
      </header>
      <div className="race-summary-intro">
        <p>
          {state.mode === "operations"
            ? "Operation Comparison highlights recorded work in separate categories."
            : "Synchronized Steps shows how each strategy unfolds on one shared clock."}{" "}
          A generator snapshot is not a unit of computational cost.
        </p>
        <p>
          Swaps already include two main-array writes. Do not add swaps and
          writes into a total. Buffer writes are a separate category. No CPU
          runtime is measured.
        </p>
      </div>
      <div
        className="race-table-scroll"
        role="region"
        aria-label="Scrollable comparison table"
        tabIndex={0}
      >
        <table>
          <caption className="sr-only">
            Current recorded metrics and registered complexities for both lanes
          </caption>
          <thead>
            <tr>
              <th scope="col">Recorded category</th>
              <th scope="col">
                A · {state.left?.algorithm.name || "Algorithm A"}
              </th>
              <th scope="col">
                B · {state.right?.algorithm.name || "Algorithm B"}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} data-metric={row.id}>
                <th scope="row">{row.label}</th>
                <td>{format(row.left)}</td>
                <td>{format(row.right)}</td>
              </tr>
            ))}
            {[
              ["Worst core time", "worst"],
              ["Core auxiliary space", "coreAuxiliarySpace"],
              ["Generator auxiliary space", "auxiliarySpace"],
            ].map(([label, key]) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>{state.left?.algorithm.complexity[key] || "—"}</td>
                <td>{state.right?.algorithm.complexity[key] || "—"}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Current completion state</th>
              <td>{state.left?.status || "Unavailable"}</td>
              <td>{state.right?.status || "Unavailable"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="race-observations">
        <span className="tiny-label">
          {partial ? "CURRENT OBSERVATIONS / PARTIAL" : "ON THIS INPUT"}
        </span>
        <ul>
          {observations.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        {state.complete && (
          <p className="race-result">
            Verified sorted output: [{state.left.snapshot.array.join(", ")}]
          </p>
        )}
        <p className="runtime-note">
          A completed lane stays fixed while the other continues. Snapshot
          counts and visual completion time do not establish a universal
          ranking. Generator space includes input/tracing state; cached
          snapshots add memory.
        </p>
      </div>
    </section>
  );
}
