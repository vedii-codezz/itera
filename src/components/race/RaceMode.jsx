import { useEffect, useLayoutEffect, useState } from "react";
import { InputStudio } from "../playground/InputStudio.jsx";
import { RacePlaybackControls } from "./RacePlaybackControls.jsx";
import { RaceLane } from "./RaceLane.jsx";
import { RaceSummary } from "./RaceSummary.jsx";
import { useRace } from "../../hooks/useRace.js";
import { RACE_ALGORITHM_IDS } from "../../race/raceController.js";
import { algorithmRegistry } from "../../engine/algorithmRegistry.js";
import { parseArray } from "../../utils/input.js";
const INITIAL = [8, 3, 6, 1, 5, 2, 7, 4];
export function RaceMode({ active = true }) {
  const [leftId, setLeft] = useState("bubble-sort"),
    [rightId, setRight] = useState("quick-sort"),
    [values, setValues] = useState(INITIAL),
    [text, setText] = useState(INITIAL.join(", ")),
    [error, setError] = useState("");
  const { state, controller } = useRace();
  const dirty = text !== values.join(", ") || !!error;
  useLayoutEffect(() => {
    controller.load({ input: values, leftId, rightId });
  }, [controller, values, leftId, rightId]);
  useEffect(() => {
    if (!active) controller.pause();
  }, [active, controller]);
  useEffect(() => {
    const shortcut = (e) => {
      if (
        !active ||
        dirty ||
        e.repeat ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.shiftKey
      )
        return;
      if (
        e.target instanceof Element &&
        e.target.closest(
          'input,select,textarea,button,a,summary,[contenteditable="true"],.algorithm-scroll,.chart-scroll,.race-table-scroll',
        )
      )
        return;
      if (e.key === " ") {
        e.preventDefault();
        if (state.playing || state.generating) controller.pause();
        else controller.play();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        controller.next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        controller.previous();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        controller.restart();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [active, dirty, state.playing, state.generating, controller]);
  function commit(next) {
    controller.pause();
    setValues(next);
    setText(next.join(", "));
    setError("");
  }
  function onError(message) {
    controller.pause();
    setError(message);
  }
  function apply() {
    try {
      commit(parseArray(text));
    } catch (cause) {
      onError(cause.message);
    }
  }
  return (
    <section className="race-workspace" aria-label="Race workspace">
      <div className="page-intro">
        <div>
          <span className="eyebrow">SAME START. DIFFERENT STRATEGIES.</span>
          <h1>
            Algorithm <em>Race</em>
          </h1>
          <p>Two algorithms. One input. See how their strategies compare.</p>
        </div>
        <span className="intro-number">
          02<span> / COMPARE</span>
        </span>
      </div>
      <section className="race-config" aria-label="Race configuration">
        <label>
          Algorithm A
          <select
            aria-label="Algorithm A"
            value={leftId}
            onChange={(e) => {
              controller.pause();
              setLeft(e.target.value);
            }}
          >
            {RACE_ALGORITHM_IDS.map((id) => (
              <option key={id} value={id}>
                {algorithmRegistry.get(id).name}
              </option>
            ))}
          </select>
        </label>
        <span className="race-versus" aria-hidden="true">
          vs.
        </span>
        <label>
          Algorithm B
          <select
            aria-label="Algorithm B"
            value={rightId}
            onChange={(e) => {
              controller.pause();
              setRight(e.target.value);
            }}
          >
            {RACE_ALGORITHM_IDS.map((id) => (
              <option key={id} value={id}>
                {algorithmRegistry.get(id).name}
              </option>
            ))}
          </select>
        </label>
        <p>
          Identical values. Independent generators. Same-algorithm comparisons
          are welcome.
        </p>
      </section>
      <InputStudio
        idPrefix="race"
        text={text}
        onTextChange={(value) => {
          controller.pause();
          setText(value);
          setError("");
        }}
        onApply={apply}
        onCommit={commit}
        onReset={() => commit([...INITIAL])}
        error={error}
        onError={onError}
      />
      <div
        className="race-mode-switch"
        role="group"
        aria-label="Comparison mode"
      >
        <button
          aria-pressed={state.mode === "steps"}
          onClick={() => controller.setMode("steps")}
        >
          Synchronized Steps
        </button>
        <button
          aria-pressed={state.mode === "operations"}
          onClick={() => controller.setMode("operations")}
        >
          Operation Comparison
        </button>
      </div>
      <p className="race-method-note">
        {state.mode === "steps"
          ? "Each tick advances each unfinished lane by one generator snapshot. A snapshot may describe a comparison, write, boundary change, or explanation."
          : "The same synchronized clock is used; comparisons, swaps and writes are shown separately. There is no invented aggregate cost or CPU benchmark."}
      </p>
      {state.error && (
        <div className="execution-error" role="alert">
          Race stopped: {state.error} Restart or change the configuration to
          retry.
        </div>
      )}
      {dirty && (
        <p className="draft-notice">
          Unapplied edits. Both lanes retain the previous committed input until
          Apply.
        </p>
      )}
      <div className="race-scale-note">
        Shared value scale:{" "}
        {values.length
          ? `${Math.min(0, ...values)} … ${Math.max(0, ...values)}`
          : "empty input"}{" "}
        · Initial values define both lanes, including held keys.
      </div>
      <div
        className={`race-lanes ${state.mode === "operations" ? "emphasize-operations" : ""}`}
      >
        <RaceLane
          label="A"
          lane={state.left}
          input={state.input}
          playing={state.playing && !dirty}
          speed={state.speed}
        />
        <RaceLane
          label="B"
          lane={state.right}
          input={state.input}
          playing={state.playing && !dirty}
          speed={state.speed}
        />
      </div>
      <RacePlaybackControls
        state={state}
        controller={controller}
        dirty={dirty}
      />
      <RaceSummary state={state} />
      <p className="keyboard-help">
        Space: start/pause · ← / →: paired steps · R: restart. Focused controls
        and scrolling regions keep their native keys.
      </p>
    </section>
  );
}
