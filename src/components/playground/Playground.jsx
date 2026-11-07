import { useEffect, useLayoutEffect, useState } from "react";
import { Command, ArrowUpRight, ArrowDownAZ } from "lucide-react";
import { Button, Panel } from "../UI.jsx";
import { InputPreview } from "../InputPreview.jsx";
import { InputStudio } from "./InputStudio.jsx";
import { PlaybackControls } from "./PlaybackControls.jsx";
import {
  Statistics,
  PseudocodePanel,
  ExplanationPanel,
  ComplexityPanel,
} from "./LivePanels.jsx";
import { SnapshotVisualization } from "../visualization/SnapshotVisualization.jsx";
import { usePlayback } from "../../hooks/usePlayback.js";
import { algorithmRegistry } from "../../engine/algorithmRegistry.js";
import { parseArray } from "../../utils/input.js";
const INITIAL = [42, 18, 65, 31, 87, 12, 56, 73, 24, 94, 38, 61];
const algorithms = algorithmRegistry.list();
export function Playground({ active = true }) {
  const [id, setId] = useState("bubble-sort"),
    [values, setValues] = useState(INITIAL),
    [text, setText] = useState(INITIAL.join(", "));
  const [error, setError] = useState(""),
    [target, setTarget] = useState(31),
    [targetText, setTargetText] = useState("31"),
    [targetError, setTargetError] = useState("");
  const { state, controller } = usePlayback(),
    algorithm = algorithmRegistry.get(id);
  const inputDirty = text !== values.join(", "),
    targetDirty = id === "binary-search" && targetText !== String(target),
    dirty = inputDirty || targetDirty;
  useLayoutEffect(() => {
    controller.load(algorithm.generate, values, { target });
  }, [algorithm, values, target, controller]);
  useEffect(() => {
    if (!active) controller.pause();
  }, [active, controller]);
  useEffect(() => {
    function shortcut(e) {
      if (
        !active ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.repeat
      )
        return;
      if (
        e.target instanceof Element &&
        e.target.closest(
          'input,select,textarea,button,a,summary,[contenteditable="true"],[role="slider"],.algorithm-scroll,.chart-scroll',
        )
      )
        return;
      if (dirty || !state.snapshot) return;
      const end =
        (state.complete || state.finalGenerated) &&
        state.index === state.generated - 1;
      if (e.key === " ") {
        e.preventDefault();
        if (state.playing || state.generating) controller.pause();
        else if (!end && !state.error) controller.play();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (!end) controller.next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        controller.previous();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        controller.restart();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [active, dirty, state, controller]);
  function commit(next) {
    controller.pause();
    setValues(next);
    setText(next.join(", "));
    setError("");
  }
  function apply() {
    try {
      commit(parseArray(text));
    } catch (e) {
      setError(e.message);
      controller.pause();
    }
  }
  function edit(value) {
    controller.pause();
    setText(value);
    setError("");
  }
  function applyTarget() {
    controller.pause();
    try {
      const next = parseArray(targetText);
      if (next.length !== 1)
        throw new Error(
          "Enter one whole-number search target between -999 and 999.",
        );
      setTarget(next[0]);
      setTargetText(String(next[0]));
      setTargetError("");
    } catch (e) {
      setTargetError(e.message);
    }
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">THINK IN STEPS. SEE THE DIFFERENCE.</span>
          <h1>
            Make sense of <em>the sequence.</em>
          </h1>
          <p>
            Take an algorithm apart. Follow every decision, one operation at a
            time.
          </p>
        </div>
        <span className="intro-number">
          01<span> / LAB</span>
        </span>
      </div>
      <section className="algorithm-selection" aria-label="Algorithm settings">
        <label htmlFor="algorithm-select">
          Algorithm
          <select
            id="algorithm-select"
            aria-label="Algorithm"
            value={id}
            onChange={(e) => {
              controller.pause();
              setId(e.target.value);
              setTargetError("");
            }}
          >
            {algorithms.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <div className="algorithm-category">
          <span className="tiny-label">{algorithm.category}</span>
          <span>
            Worst <strong>{algorithm.complexity.worst}</strong>
          </span>
          <span>
            Generator space{" "}
            <strong>{algorithm.complexity.auxiliarySpace}</strong>
          </span>
        </div>
        {id === "binary-search" && (
          <form
            className="target-editor"
            onSubmit={(e) => {
              e.preventDefault();
              applyTarget();
            }}
          >
            <label>
              Search target
              <input
                aria-label="Search target"
                inputMode="numeric"
                value={targetText}
                aria-invalid={!!targetError}
                onChange={(e) => {
                  controller.pause();
                  setTargetText(e.target.value);
                  setTargetError("");
                }}
              />
            </label>
            <Button type="submit" aria-label="Apply target">
              Apply target
            </Button>
          </form>
        )}
      </section>
      {id === "binary-search" && (
        <div className="search-requirement">
          <span>
            Binary Search needs ascending sorted input. Duplicates return the
            leftmost match.
          </span>
          {state.error?.includes("sorted") && (
            <Button
              icon={ArrowDownAZ}
              disabled={inputDirty}
              aria-label="Sort input explicitly"
              onClick={() => commit([...values].sort((a, b) => a - b))}
            >
              Sort input explicitly
            </Button>
          )}
        </div>
      )}
      {(state.error || targetError) && (
        <div className="execution-error" role="alert">
          {targetError || state.error}
        </div>
      )}
      <div className="workspace-grid execution-workspace">
        <div className="primary-column">
          <InputStudio
            text={text}
            onTextChange={edit}
            onApply={apply}
            onCommit={commit}
            onReset={() => commit([...INITIAL])}
            error={error}
            onError={setError}
          />
          <Panel
            title={algorithm.name}
            eyebrow="02 / EXECUTE"
            className="canvas"
          >
            <div className="canvas-meta">
              <span className="operation-tag">
                {state.snapshot?.operation || "INPUT PREVIEW"}
              </span>
              <span className="mono">
                {values.length} ELEMENTS
                {values.length > 16 ? " · SCROLL TO EXPLORE" : ""}
              </span>
            </div>
            {state.snapshot ? (
              <SnapshotVisualization
                algorithm={algorithm}
                snapshot={state.snapshot}
                playing={state.playing && !dirty}
                speed={state.speed}
              />
            ) : (
              <InputPreview values={values} />
            )}
            <PlaybackControls
              state={state}
              controller={controller}
              dirty={dirty}
            />
          </Panel>
          <Statistics algorithm={algorithm} snapshot={state.snapshot} />
          <div className="keyboard-help">
            <Command size={14} />
            <span>
              <kbd>Space</kbd> play / pause · <kbd>←</kbd> <kbd>→</kbd> step ·{" "}
              <kbd>R</kbd> restart
            </span>
          </div>
        </div>
        <aside className="details-column">
          <ExplanationPanel
            snapshot={state.snapshot}
            error={state.error}
            dirty={dirty}
          />
          <PseudocodePanel algorithm={algorithm} snapshot={state.snapshot} />
          <ComplexityPanel algorithm={algorithm} />
        </aside>
      </div>
      <div className="bottom-strip">
        <span>Real generators. Every frame accounted for.</span>
        <span>
          See the logic. Follow the flow. <ArrowUpRight size={14} />
        </span>
      </div>
    </>
  );
}
