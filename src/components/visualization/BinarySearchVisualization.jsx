import {
  elementState,
  formatNumber,
  stateLabels,
  formatRange,
} from "./visualModel.js";
import { SvgFrame, PointerLabels, EmptyInput } from "./VisualPrimitives.jsx";
export function BinarySearchVisualization({ snapshot, availableWidth = 520 }) {
  const width = Math.max(320, availableWidth, snapshot.array.length * 58 + 48),
    step = (width - 48) / Math.max(1, snapshot.array.length),
    x = (i) => 24 + i * step + step / 2;
  return (
    <>
      <div className="operation-context">
        <span>
          Target <strong>{snapshot.variables.target}</strong>
        </span>
        <span>
          Search interval{" "}
          <strong>{formatRange(snapshot.metadata.interval)}</strong>
        </span>
        <span>
          Leftmost candidate{" "}
          <strong>
            {snapshot.variables.candidate === -1
              ? "—"
              : snapshot.variables.candidate}
          </strong>
        </span>
      </div>
      <SvgFrame width={width} height={300} label="Binary Search visualization">
        {snapshot.array.map((value, i) => {
          const state = elementState(snapshot, i);
          return (
            <g
              key={i}
              data-testid={`element-${i}`}
              data-value={value}
              data-state={state}
              className={`visual-element cell state-${state}`}
            >
              <title>{`Index ${i}: ${value}; ${stateLabels[state]}`}</title>
              <rect
                x={x(i) - step * 0.4}
                y="80"
                width={step * 0.8}
                height="55"
                rx="3"
              />
              <text x={x(i)} y="112" textAnchor="middle" className="cell-value">
                {formatNumber(value)}
              </text>
              <text
                x={x(i)}
                y="158"
                textAnchor="middle"
                className="index-label"
              >
                {i}
              </text>
              {state === "found" && (
                <text
                  x={x(i)}
                  y="63"
                  textAnchor="middle"
                  className="state-code"
                >
                  MATCH
                </text>
              )}
              {state === "eliminated" && (
                <path d={`M${x(i) - 8} 90l16 36`} className="eliminated-mark" />
              )}
            </g>
          );
        })}
        {!snapshot.array.length && <EmptyInput width={width} />}
        <PointerLabels
          pointers={snapshot.pointers}
          length={snapshot.array.length}
          width={width}
          x={x}
          y={190}
        />
      </SvgFrame>
      <p className="visual-caption">
        Pointers use separate rows when they share an index. A match is retained
        while the search checks for an earlier duplicate.
      </p>
    </>
  );
}
