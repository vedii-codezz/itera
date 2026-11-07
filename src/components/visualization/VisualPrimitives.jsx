import { formatNumber, stateLabels, elementState } from "./visualModel.js";
export function SvgFrame({ width, height, label, children }) {
  return (
    <div
      className="algorithm-scroll"
      role="region"
      aria-label="Scrollable algorithm visualization"
      tabIndex={0}
    >
      <svg
        className="execution-svg"
        role="img"
        aria-label={label}
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: width }}
      >
        {children}
      </svg>
    </div>
  );
}
export function PointerLabels({ pointers, length, width, x, y = 295 }) {
  return Object.entries(pointers).map(([name, index], lane) => {
    const valid = index >= 0 && index < length;
    const position = valid ? x(index) : index < 0 ? 10 : width - 10;
    return (
      <text
        key={name}
        data-testid={`pointer-${name}`}
        data-index={index}
        x={position}
        y={y + lane * 18}
        textAnchor={valid ? "middle" : index < 0 ? "start" : "end"}
        className="pointer-label"
      >
        {name}
        {valid ? ` ↓` : `=${index} · boundary`}
      </text>
    );
  });
}
export function SnapshotTable({ snapshot }) {
  return (
    <details className="snapshot-access">
      <summary>Array values & states · accessible table</summary>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Index</th>
              <th scope="col">Value</th>
              <th scope="col">State</th>
              <th scope="col">Pointers</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.array.map((value, i) => (
              <tr key={i}>
                <th scope="row">{i}</th>
                <td>{formatNumber(value)}</td>
                <td>
                  {snapshot.metadata?.hole === i
                    ? stateLabels.hole
                    : Object.entries(snapshot.highlights)
                        .filter(([, indices]) => indices.includes(i))
                        .map(([key]) => key)
                        .join(", ") || stateLabels[elementState(snapshot, i)]}
                </td>
                <td>
                  {Object.entries(snapshot.pointers)
                    .filter(([, position]) => position === i)
                    .map(([name]) => name)
                    .join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
export function Legend({ kind }) {
  const states =
    kind === "search"
      ? ["active", "compare", "found", "eliminated"]
      : kind === "kadane"
        ? ["active", "current", "best"]
        : ["default", "compare", "swap", "sorted", "active", "selected"];
  return (
    <ul className="state-legend" aria-label="Visualization legend">
      {states.map((state) => (
        <li key={state}>
          <i className={`legend-symbol state-${state}`} aria-hidden="true" />
          {stateLabels[state]}
        </li>
      ))}
    </ul>
  );
}
export function EmptyInput({ width = 520 }) {
  return (
    <text x={width / 2} y="125" textAnchor="middle" className="svg-note">
      Empty array · no elements to inspect
    </text>
  );
}
