import { algorithmRegistry } from "../engine/algorithmRegistry.js";
import { createPlaybackController } from "../engine/playbackController.js";
import { validateInput } from "../algorithms/execution.js";

export const RACE_ALGORITHM_IDS = Object.freeze([
  "bubble-sort",
  "insertion-sort",
  "merge-sort",
  "quick-sort",
]);
export const RACE_MODES = Object.freeze(["steps", "operations"]);

/** One paired clock; algorithm iteration and snapshot storage remain in the two existing controllers. */
export function createRaceController({
  interval = 600,
  maxSnapshots = 20000,
  maxTicks = 20000,
  registry = algorithmRegistry,
} = {}) {
  if (!Number.isFinite(interval) || interval <= 0)
    throw new Error("Race interval must be positive.");
  for (const limit of [maxSnapshots, maxTicks])
    if (!Number.isInteger(limit) || limit < 1 || limit > 20000)
      throw new Error("Race cache limits must be integers from 1 to 20,000.");
  let controllers = null,
    definitions = null,
    configuration = null,
    input = Object.freeze([]),
    expected = [];
  let history = [],
    cursor = -1,
    sessionId = 0,
    epoch = 0,
    timer = null,
    pendingEnd = null,
    disposed = false;
  let playing = false,
    generating = false,
    knownComplete = false,
    error = null,
    speed = 1,
    mode = "steps";
  const listeners = new Set();
  const terminal = (controller) => {
    const s = controller.getState();
    return (
      s.snapshot?.status === "complete" ||
      (s.complete && s.index === s.generated - 1)
    );
  };
  const atEnd = () => !!controllers && controllers.every(terminal);
  function laneView(index) {
    if (!controllers) return null;
    const s = controllers[index].getState(),
      complete = terminal(controllers[index]);
    return Object.freeze({
      algorithm: definitions[index],
      snapshot: s.snapshot,
      index: s.index,
      generated: s.generated,
      knownComplete: s.finalGenerated || s.complete,
      complete,
      error: s.error,
      status: s.error
        ? "Error"
        : complete
          ? "Completed"
          : playing
            ? "Running"
            : generating
              ? "Generating"
              : s.index <= 0
                ? "Ready"
                : "Paused",
    });
  }
  function view() {
    const complete = !error && atEnd();
    return Object.freeze({
      sessionId,
      input,
      left: laneView(0),
      right: laneView(1),
      tick: cursor,
      generatedTicks: history.length,
      pair: history[cursor] || null,
      playing,
      generating,
      speed,
      mode,
      complete,
      knownComplete,
      error,
      status: error
        ? "Error"
        : complete
          ? "Completed"
          : generating
            ? "Generating"
            : playing
              ? "Running"
              : cursor < 0
                ? "idle"
                : cursor === 0
                  ? "Ready"
                  : "Paused",
    });
  }
  let state = view();
  function publish() {
    state = view();
    listeners.forEach((fn) => fn());
  }
  function stopTimer() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }
  function cancel() {
    epoch++;
    stopTimer();
    playing = false;
    generating = false;
    const resolve = pendingEnd;
    pendingEnd = null;
    resolve?.(false);
  }
  function destroyLanes() {
    controllers?.forEach((c) => c.dispose());
    controllers = null;
    definitions = null;
  }
  function record() {
    history.push(
      Object.freeze({
        left: controllers[0].getState().index,
        right: controllers[1].getState().index,
      }),
    );
    cursor = history.length - 1;
  }
  function inspect() {
    for (let index = 0; index < 2; index++) {
      const s = controllers[index].getState(),
        name = definitions[index].name;
      if (s.error) {
        error = `${name}: ${s.error}`;
        break;
      }
      if (terminal(controllers[index])) {
        const values = s.snapshot?.array,
          result = s.snapshot?.result;
        if (
          !Array.isArray(values) ||
          JSON.stringify(values) !== JSON.stringify(expected) ||
          !Array.isArray(result) ||
          JSON.stringify(result) !== JSON.stringify(expected)
        ) {
          error = `${name}: final output does not match the correctly sorted original input.`;
          break;
        }
      }
    }
    if (error || atEnd()) {
      playing = false;
      stopTimer();
    }
    if (!error && atEnd()) knownComplete = true;
  }
  function restore(position) {
    const pair = history[position];
    controllers[0].seek(pair.left);
    controllers[1].seek(pair.right);
    cursor = position;
  }
  function advance() {
    if (disposed || !controllers) return false;
    if (cursor + 1 < history.length) {
      restore(cursor + 1);
      inspect();
      publish();
      return true;
    }
    if (error) return false;
    if (atEnd()) return false;
    if (history.length >= maxTicks) {
      error = `Race timeline limit (${maxTicks}) reached. Use a smaller input.`;
      playing = false;
      stopTimer();
      publish();
      return false;
    }
    for (const controller of controllers) {
      if (!terminal(controller)) controller.next();
      if (controller.getState().error) break;
    }
    record();
    inspect();
    publish();
    return !error;
  }
  function schedule() {
    stopTimer();
    if (!playing || disposed) return;
    const ticket = epoch;
    timer = setTimeout(() => {
      timer = null;
      if (ticket !== epoch || !playing || disposed) return;
      if (advance() && playing) schedule();
    }, interval / speed);
  }
  const api = {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    load({
      input: values = [],
      leftId = "bubble-sort",
      rightId = "quick-sort",
    } = {}) {
      if (disposed) return;
      cancel();
      destroyLanes();
      sessionId++;
      history = [];
      cursor = -1;
      knownComplete = false;
      error = null;
      configuration = null;
      input = Object.freeze([]);
      expected = [];
      try {
        validateInput(values);
        input = Object.freeze([...values]);
        configuration = { input: [...values], leftId, rightId };
        if (
          !RACE_ALGORITHM_IDS.includes(leftId) ||
          !RACE_ALGORITHM_IDS.includes(rightId)
        )
          throw new Error(
            "Unsupported race algorithm. Choose one of the four sorting algorithms.",
          );
        definitions = [registry.get(leftId), registry.get(rightId)];
        if (definitions.some((d) => d.category !== "Sorting"))
          throw new Error(
            "Only sorting algorithms are eligible for Race Mode.",
          );
        controllers = definitions.map(() =>
          createPlaybackController({ maxSnapshots }),
        );
        expected = [...values].sort((a, b) => a - b);
        controllers.forEach((c, i) =>
          c.load(definitions[i].generate, [...values]),
        );
        record();
        inspect();
      } catch (cause) {
        error = cause.message;
      }
      publish();
    },
    play() {
      if (disposed || !controllers || error || atEnd() || generating) return;
      playing = true;
      publish();
      schedule();
    },
    pause() {
      cancel();
      publish();
    },
    next() {
      cancel();
      if (!advance()) publish();
    },
    previous() {
      cancel();
      if (controllers && cursor > 0) restore(cursor - 1);
      publish();
    },
    seek(tick) {
      cancel();
      if (
        controllers &&
        Number.isInteger(tick) &&
        tick >= 0 &&
        tick < history.length
      )
        restore(tick);
      publish();
    },
    restart() {
      if (error && configuration) {
        api.load(configuration);
        return;
      }
      cancel();
      if (controllers && history.length) restore(0);
      publish();
    },
    setSpeed(value) {
      if (!Number.isFinite(value) || value < 0.25 || value > 4)
        throw new Error("Speed must be between 0.25× and 4×.");
      speed = value;
      if (playing) {
        epoch++;
        schedule();
      }
      publish();
    },
    setMode(value) {
      if (!RACE_MODES.includes(value))
        throw new Error("Choose Synchronized Steps or Operation Comparison.");
      mode = value;
      publish();
    },
    endAsync() {
      cancel();
      if (disposed || !controllers || error) return Promise.resolve(false);
      generating = true;
      publish();
      const ticket = epoch;
      return new Promise((resolve) => {
        pendingEnd = resolve;
        const chunk = () => {
          timer = null;
          if (ticket !== epoch || disposed || !generating) return;
          const started = performance.now();
          for (let count = 0; count < 64; count++) {
            if (!advance() || atEnd() || performance.now() - started >= 8)
              break;
          }
          if (ticket !== epoch || !generating) return;
          if (error || atEnd()) {
            const successful = !error && atEnd();
            pendingEnd = null;
            generating = false;
            publish();
            resolve(successful);
          } else timer = setTimeout(chunk, 0);
        };
        timer = setTimeout(chunk, 0);
      });
    },
    clear() {
      cancel();
      destroyLanes();
      configuration = null;
      input = Object.freeze([]);
      expected = [];
      history = [];
      cursor = -1;
      error = null;
      knownComplete = false;
      publish();
    },
    dispose() {
      cancel();
      destroyLanes();
      history = [];
      cursor = -1;
      input = Object.freeze([]);
      expected = [];
      configuration = null;
      knownComplete = false;
      error = null;
      disposed = true;
      listeners.clear();
      state = view();
    },
  };
  return api;
}
