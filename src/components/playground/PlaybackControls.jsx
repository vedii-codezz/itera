import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Square,
} from "lucide-react";
import { Button } from "../UI.jsx";
export function executionStatus(state, dirty) {
  if (state.error) return "Error";
  if (dirty) return "Unapplied edits";
  if (state.generating) return "Generating";
  if (state.snapshot?.status === "complete") return "Completed";
  if (state.playing) return "Playing";
  return state.index <= 0 ? "Ready" : "Paused";
}
export function PlaybackControls({ state, controller, dirty }) {
  const blocked = !state.snapshot || dirty,
    atEnd =
      (state.finalGenerated || state.complete) &&
      state.index === state.generated - 1;
  const forwardBlocked =
    blocked || atEnd || (!!state.error && state.index === state.generated - 1);
  const label = state.playing ? "Pause" : state.index > 0 ? "Resume" : "Play";
  return (
    <div className="playback-controls" aria-label="Playback controls">
      <div className="transport-row">
        <div className="transport-buttons">
          <Button
            aria-label="Jump to beginning"
            title="Jump to beginning"
            icon={SkipBack}
            disabled={blocked || state.index <= 0}
            onClick={() => controller.restart()}
          />
          <Button
            aria-label="Previous step"
            title="Previous step · ←"
            icon={ChevronLeft}
            disabled={blocked || state.index <= 0}
            onClick={() => controller.previous()}
          />
          <Button
            aria-label={label}
            icon={state.playing ? Pause : Play}
            variant="primary"
            disabled={
              !state.playing &&
              (forwardBlocked || !!state.error || state.generating)
            }
            onClick={() =>
              state.playing ? controller.pause() : controller.play()
            }
          >
            {label}
          </Button>
          <Button
            aria-label="Next step"
            title="Next step · →"
            icon={ChevronRight}
            disabled={forwardBlocked}
            onClick={() => controller.next()}
          />
          <Button
            aria-label="Jump to end"
            title="Generate remaining steps in cancellable chunks"
            icon={SkipForward}
            disabled={blocked || atEnd || !!state.error || state.generating}
            onClick={() => {
              void controller.endAsync();
            }}
          />
          <Button
            aria-label="Restart"
            title="Restart · R"
            icon={RotateCcw}
            disabled={blocked}
            onClick={() => controller.restart()}
          />
          {state.generating && (
            <Button
              aria-label="Cancel generation"
              icon={Square}
              onClick={() => controller.pause()}
            >
              Cancel
            </Button>
          )}
        </div>
        <label className="speed-control">
          Speed <output>{state.speed.toFixed(2).replace(/0$/, "")}×</output>
          <input
            aria-label="Playback speed"
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={state.speed}
            onChange={(e) => controller.setSpeed(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="timeline-heading">
        <span aria-label="Timeline summary">
          Step {Math.max(0, state.index + 1)} / {state.generated}{" "}
          {state.finalGenerated || state.complete
            ? "total"
            : "generated · more on demand"}
        </span>
        <span className="execution-status" aria-label="Execution status" role="status">
          {executionStatus(state, dirty)}
        </span>
      </div>
      <input
        className="timeline-slider"
        aria-label="Timeline"
        aria-valuetext={`Step ${state.index + 1} of ${state.generated} ${state.finalGenerated || state.complete ? "total" : "generated"}`}
        type="range"
        min="0"
        max={Math.max(0, state.generated - 1)}
        step="1"
        value={Math.max(0, state.index)}
        disabled={blocked || state.generated < 2}
        onChange={(e) => controller.seek(Number(e.target.value))}
      />
      <div className="timeline-help">
        <span>
          Scrubbing pauses playback. The timeline spans generated steps.
        </span>
        <span>0.25× — 4×</span>
      </div>
    </div>
  );
}
