import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  RotateCcw,
  Square,
} from "lucide-react";
import { Button } from "../UI.jsx";
export function RacePlaybackControls({ state, controller, dirty }) {
  const blocked = dirty || !state.left || !state.right;
  const last = state.tick === state.generatedTicks - 1;
  const forwardBlocked = blocked || state.complete || (!!state.error && last);
  const label = state.playing
    ? "Pause race"
    : state.tick > 0
      ? "Resume race"
      : "Start race";
  return (
    <section className="panel race-transport" aria-label="Shared race playback">
      <div className="playback-controls">
        <div className="transport-row">
          <div className="transport-buttons">
            <Button
              icon={SkipBack}
              aria-label="Race beginning"
              title="Jump to beginning"
              disabled={blocked || state.tick <= 0}
              onClick={() => controller.seek(0)}
            />
            <Button
              icon={ChevronLeft}
              aria-label="Previous race step"
              title="Previous paired tick"
              disabled={blocked || state.tick <= 0}
              onClick={() => controller.previous()}
            />
            <Button
              icon={state.playing ? Pause : Play}
              variant="primary"
              aria-label={label}
              disabled={
                !state.playing &&
                (forwardBlocked || !!state.error || state.generating)
              }
              onClick={() =>
                state.playing ? controller.pause() : controller.play()
              }
            >
              {state.playing ? "Pause" : state.tick > 0 ? "Resume" : "Start"}
            </Button>
            <Button
              icon={ChevronRight}
              aria-label="Next race step"
              title="Advance each unfinished lane once"
              disabled={forwardBlocked}
              onClick={() => controller.next()}
            />
            <Button
              icon={SkipForward}
              aria-label="Finish race"
              title="Generate remaining paired ticks in cancellable chunks"
              disabled={
                blocked || state.complete || !!state.error || state.generating
              }
              onClick={() => {
                void controller.endAsync();
              }}
            >
              Finish
            </Button>
            <Button
              icon={RotateCcw}
              aria-label="Restart race"
              disabled={blocked && !state.error}
              onClick={() => controller.restart()}
            >
              Restart
            </Button>
            {state.generating && (
              <Button
                icon={Square}
                aria-label="Cancel race generation"
                onClick={() => controller.pause()}
              >
                Cancel
              </Button>
            )}
          </div>
          <label className="speed-control">
            Shared speed<output>{state.speed}×</output>
            <input
              type="range"
              aria-label="Race speed"
              min="0.25"
              max="4"
              step="0.25"
              value={state.speed}
              onChange={(e) => controller.setSpeed(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="timeline-heading">
          <span aria-label="Race timeline summary">
            Tick {Math.max(0, state.tick)} · {state.generatedTicks} paired
            states {state.knownComplete ? "total" : "generated"}
          </span>
          <span
            className="execution-status"
            role="status"
            aria-label="Race status"
          >
            {dirty ? "Unapplied edits" : state.status}
          </span>
        </div>
        <input
          aria-label="Race timeline"
          className="timeline-slider"
          type="range"
          min="0"
          max={Math.max(0, state.generatedTicks - 1)}
          step="1"
          value={Math.max(0, state.tick)}
          disabled={blocked || state.generatedTicks < 2}
          onChange={(e) => controller.seek(Number(e.target.value))}
        />
        <div className="timeline-help">
          <span>
            Tick 0 is the initial pair. Seeking pauses both lanes; the slider
            spans retained pairs.
          </span>
          <span>One clock · two strategies</span>
        </div>
      </div>
    </section>
  );
}
