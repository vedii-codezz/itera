import {
  elementState,
  formatNumber,
  formatRange,
  stateLabels,
  plotScale,
} from "./visualModel.js";
import { SvgFrame, PointerLabels, EmptyInput } from "./VisualPrimitives.jsx";
export function KadaneVisualization({ snapshot, availableWidth = 520 }) {
  const { array, metadata, variables } = snapshot;
  const width = Math.max(320, availableWidth, array.length * 58 + 48),
    step = (width - 48) / Math.max(1, array.length),
    x = (i) => 24 + i * step + step / 2;
  const sums = metadata.runningSums || [],
    { y, zero, high, low } = plotScale(sums, 35, 155);
  return (
    <>
      <div className="sum-cards">
        <div>
          Running sum <strong>{formatNumber(variables.currentSum)}</strong>
          <small>Current {formatRange(metadata.currentRange)}</small>
        </div>
        <div>
          Best sum <strong>{formatNumber(variables.bestSum)}</strong>
          <small>Best {formatRange(metadata.bestRange)}</small>
        </div>
      </div>
      <SvgFrame width={width} height={245} label="Kadane array visualization">
        {array.map((value, i) => {
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
                y="45"
                width={step * 0.8}
                height="50"
                rx="3"
              />
              <text x={x(i)} y="75" textAnchor="middle" className="cell-value">
                {formatNumber(value)}
              </text>
              <text
                x={x(i)}
                y="115"
                textAnchor="middle"
                className="index-label"
              >
                {i}
              </text>
              {snapshot.highlights.current?.includes(i) && (
                <line
                  x1={x(i) - step * 0.38}
                  x2={x(i) + step * 0.38}
                  y1="130"
                  y2="130"
                  className="current-underline"
                />
              )}
              {snapshot.highlights.best?.includes(i) && (
                <line
                  x1={x(i) - step * 0.38}
                  x2={x(i) + step * 0.38}
                  y1="141"
                  y2="141"
                  className="best-underline"
                />
              )}
            </g>
          );
        })}
        {!array.length && <EmptyInput width={width} />}
        <PointerLabels
          pointers={snapshot.pointers}
          length={array.length}
          width={width}
          x={x}
          y={174}
        />
      </SvgFrame>
      <div className="running-chart">
        <div className="chart-heading">
          <span>RUNNING SUM / ENDING AT EACH INDEX</span>
          <span>
            {snapshot.operation === "restart"
              ? "RESTART · new current range"
              : `${sums.length} observed values`}
          </span>
        </div>
        <div className="chart-scroll">
          <svg
            viewBox={`0 0 ${width} 190`}
            style={{ minWidth: width }}
            role="img"
            aria-label="Running-sum chart with zero baseline"
          >
            <line
              data-testid="zero-baseline"
              x1="18"
              x2={width - 18}
              y1={zero}
              y2={zero}
              className="zero-line"
            />
            <text x="8" y={zero - 8} className="index-label">
              0
            </text>
            <text
              x={width - 12}
              y="20"
              textAnchor="end"
              className="index-label"
            >
              {formatNumber(high)}
            </text>
            <text
              x={width - 12}
              y="180"
              textAnchor="end"
              className="index-label"
            >
              {formatNumber(low)}
            </text>
            {sums.length > 1 && (
              <polyline
                points={sums.map((sum, i) => `${x(i)},${y(sum)}`).join(" ")}
                className="sum-line"
              />
            )}
            {sums.map((sum, i) => (
              <g key={i}>
                <circle
                  data-testid={`running-point-${i}`}
                  data-value={sum}
                  cx={x(i)}
                  cy={y(sum)}
                  r="4"
                  className="sum-point"
                />
                <text
                  x={x(i)}
                  y={y(sum) - 10}
                  textAnchor="middle"
                  className="index-label"
                >
                  {formatNumber(sum)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </>
  );
}
