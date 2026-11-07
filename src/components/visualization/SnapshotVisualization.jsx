import { memo, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useMotionPreference } from "../../hooks/useMotionPreference.js";
import { SortingVisualization } from "./SortingVisualization.jsx";
import { BinarySearchVisualization } from "./BinarySearchVisualization.jsx";
import { KadaneVisualization } from "./KadaneVisualization.jsx";
import { Legend, SnapshotTable } from "./VisualPrimitives.jsx";
export const SnapshotVisualization = memo(function SnapshotVisualization({
  algorithm,
  snapshot,
  playing = false,
  speed = 1,
  scaleValues,
}) {
  const reduced = useMotionPreference();
  const container = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(520);
  useLayoutEffect(() => {
    const node = container.current;
    const measure = () => {
      if (node.clientWidth) setAvailableWidth(node.clientWidth);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const kind =
    algorithm.id === "binary-search"
      ? "search"
      : algorithm.id === "kadane"
        ? "kadane"
        : "sorting";
  return (
    <motion.div
      ref={container}
      initial={false}
      animate={{ opacity: 1 }}
      className="snapshot-visualization"
      data-animate={playing && !reduced ? "true" : "false"}
      style={{ "--step-transition": `${Math.min(140, 180 / speed)}ms` }}
    >
      {kind === "sorting" ? (
        <SortingVisualization
          algorithm={algorithm}
          snapshot={snapshot}
          availableWidth={availableWidth}
          scaleValues={scaleValues}
        />
      ) : kind === "search" ? (
        <BinarySearchVisualization
          snapshot={snapshot}
          availableWidth={availableWidth}
        />
      ) : (
        <KadaneVisualization
          snapshot={snapshot}
          availableWidth={availableWidth}
        />
      )}
      {Math.max(
        320,
        snapshot.array.length * (kind === "sorting" ? 44 : 58) + 48,
      ) > availableWidth && (
        <p className="visual-caption">
          Scroll horizontally to inspect all {snapshot.array.length} values →
        </p>
      )}
      <Legend kind={kind} />
      <SnapshotTable snapshot={snapshot} />
    </motion.div>
  );
});
