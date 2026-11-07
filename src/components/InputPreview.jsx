import { memo } from "react";
export const InputPreview = memo(function InputPreview({ values }) {
  const width = Math.max(620, values.length * 32),
    height = 280,
    baseline = values.some((v) => v < 0) ? 160 : 240;
  const max = Math.max(1, ...values.map(Math.abs)),
    step = (width - 64) / Math.max(1, values.length);
  return (
    <div
      className="svg-scroll"
      tabIndex="0"
      aria-label="Scrollable input visualization"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: values.length > 24 ? width : undefined }}
        role="img"
        aria-label={`Unexecuted input preview: ${values.join(", ") || "empty array"}`}
      >
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="var(--border)"
              strokeOpacity=".25"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />
        <line
          x1="20"
          y1={baseline}
          x2={width - 20}
          y2={baseline}
          stroke="var(--border)"
        />
        {values.map((v, i) => {
          const h = Math.max(
              3,
              (Math.abs(v) / max) * (baseline === 160 ? 100 : 170),
            ),
            x = 32 + i * step;
          return (
            <g key={i}>
              <rect
                x={x + 3}
                y={v < 0 ? baseline : baseline - h}
                width={Math.max(8, step - 9)}
                height={h}
                rx="2"
                fill="var(--bar)"
              />
              <text
                x={x + step / 2 - 1}
                y={v < 0 ? baseline + h + 16 : baseline - h - 12}
                textAnchor="middle"
                fill="var(--text)"
                fontSize="12"
                fontFamily="monospace"
              >
                {v}
              </text>
              <text
                x={x + step / 2 - 1}
                y={height - 9}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize="10"
                fontFamily="monospace"
              >
                {i.toString().padStart(2, "0")}
              </text>
            </g>
          );
        })}
        {!values.length && (
          <text x={width / 2} y="140" textAnchor="middle" fill="var(--muted)">
            Empty array · add values to preview
          </text>
        )}
      </svg>
    </div>
  );
});
