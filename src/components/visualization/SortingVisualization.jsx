import {
  formatNumber,
  formatRange,
  elementState,
  plotScale,
  stateLabels,
} from "./visualModel.js";
import { SvgFrame, PointerLabels, EmptyInput } from "./VisualPrimitives.jsx";
export function SortingVisualization({
  algorithm,
  snapshot,
  availableWidth = 520,
  scaleValues,
}) {
  const {
    array,
    metadata: m,
    variables: v,
    pointers: p,
    highlights: h,
  } = snapshot;
  const width = Math.max(320, availableWidth, array.length * 44 + 48),
    step = (width - 48) / Math.max(1, array.length),
    x = (i) => 24 + i * step + step / 2;
  const { y, zero } = plotScale(scaleValues ?? array, 55, 235);
  const swap = h.swapping?.length === 2 ? h.swapping : null;
  return (
    <>
      <div className="operation-context">
        {algorithm.id === "bubble-sort" && (
          <span>
            Sorted suffix{" "}
            <strong>
              {h.sorted.length} / {array.length}
            </strong>
            {snapshot.operation === "pass" ? " · pass complete" : ""}
          </span>
        )}
        {algorithm.id === "insertion-sort" && (
          <>
            <span>
              Held key <strong>{formatNumber(v.key)}</strong>
            </span>
            <span>
              Hole <strong>{m.hole ?? "—"}</strong>
            </span>
            <span>
              Sorted prefix <strong>{formatRange(m.prefixRange)}</strong>
            </span>
            {m.from !== undefined && (
              <span>
                Shift{" "}
                <strong>
                  {m.from} → {m.to}
                </strong>
              </span>
            )}
          </>
        )}
        {algorithm.id === "merge-sort" && (
          <>
            <span>
              Left <strong>{formatRange(m.leftRange)}</strong>
            </span>
            <span>
              Right <strong>{formatRange(m.rightRange)}</strong>
            </span>
            <span>
              Depth <strong>{m.depth ?? "—"}</strong>
            </span>
            {m.mergedRange && (
              <span>
                Merged <strong>{formatRange(m.mergedRange)}</strong>
              </span>
            )}
          </>
        )}
        {algorithm.id === "quick-sort" && (
          <>
            <span>
              Pivot <strong>{formatNumber(v.pivot)}</strong>
            </span>
            <span>
              Range <strong>{formatRange(m.range)}</strong>
            </span>
            <span>
              Lower partition <strong>{formatRange(m.lowerRange)}</strong>
            </span>
            {m.pendingSwap && (
              <span>
                Pending exchange <strong>{m.pendingSwap.join(" ↔ ")}</strong>
              </span>
            )}
          </>
        )}
      </div>
      <SvgFrame
        width={width}
        height={Math.max(360, 300 + Object.keys(p).length * 18)}
        label={`${algorithm.name} visualization`}
      >
        <line
          x1="14"
          x2={width - 14}
          y1={zero}
          y2={zero}
          className="zero-line"
        />
        {swap && (
          <path
            d={`M ${x(swap[0])} 36 Q ${(x(swap[0]) + x(swap[1])) / 2} 5 ${x(swap[1])} 36`}
            className="swap-link"
          />
        )}
        {m.from !== undefined && (
          <path
            d={`M ${x(m.from)} 25 L ${x(m.to)} 25 l -6 -4 m 6 4 l -6 4`}
            className="shift-link"
          />
        )}
        {array.map((value, i) => {
          const state = elementState(snapshot, i),
            hole = m.hole === i,
            barY = Math.min(y(value), zero),
            height = Math.max(2, Math.abs(y(value) - zero));
          return (
            <g
              key={i}
              data-testid={`element-${i}`}
              data-value={value}
              data-state={state}
              className={`visual-element state-${state}`}
            >
              <title>{`Index ${i}: ${value}; ${stateLabels[state]}${hole ? "; the key is held separately" : ""}`}</title>
              <rect
                className="value-bar"
                x={x(i) - step * 0.32}
                y={value === 0 ? zero - 1 : barY}
                width={step * 0.64}
                height={height}
                rx="2"
              />
              <text
                x={x(i)}
                y={value < 0 ? y(value) + 17 : barY - 10}
                textAnchor="middle"
                className="value-label"
              >
                {hole ? "□" : formatNumber(value)}
              </text>
              <text
                x={x(i)}
                y="270"
                textAnchor="middle"
                className="index-label"
              >
                {i}
              </text>
              {state !== "default" && (
                <text
                  x={x(i)}
                  y="287"
                  textAnchor="middle"
                  className="state-code"
                >
                  {hole
                    ? "HOLE"
                    : state === "pivot"
                      ? "PIV"
                      : state === "sorted"
                        ? "✓"
                        : state === "compare"
                          ? "CMP"
                          : state === "swap"
                            ? "SWP"
                            : state === "active"
                              ? "ACT"
                              : state === "prefix"
                                ? "PRE"
                                : state === "merged"
                                  ? "MRG"
                                  : "REG"}
                </text>
              )}
            </g>
          );
        })}
        {!array.length && <EmptyInput width={width} />}
        <PointerLabels
          pointers={p}
          length={array.length}
          width={width}
          x={x}
          y={310}
        />
      </SvgFrame>
      {algorithm.id === "merge-sort" && m.buffer && (
        <div className="merge-buffers">
          <div aria-label="Left merge values">
            <span>Left · next offset {m.leftCursor}</span>
            <code>[{m.left.map(formatNumber).join(", ")}]</code>
          </div>
          <div aria-label="Right merge values">
            <span>Right · next offset {m.rightCursor}</span>
            <code>[{m.right.map(formatNumber).join(", ")}]</code>
          </div>
          <div aria-label="Merge buffer">
            <span>
              Merge buffer
              {m.bufferCursor !== undefined
                ? ` · writing offset ${m.bufferCursor}`
                : ""}
            </span>
            <code>[{m.buffer.map(formatNumber).join(", ")}]</code>
          </div>
        </div>
      )}
    </>
  );
}
