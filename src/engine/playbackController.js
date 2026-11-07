import { createSnapshot } from "./snapshot.js";
/** Lazy generation; one cached frame per yielded semantic operation, never per animation frame. */
export function createPlaybackController({
  interval = 600,
  maxSnapshots = 20000,
} = {}) {
  let iterator = null,
    frames = [],
    timer = null,
    disposed = false;
  const listeners = new Set();
  let chunkTimer = null,
    finishJob = null;
  let state = {
    index: -1,
    snapshot: null,
    playing: false,
    speed: 1,
    complete: false,
    generated: 0,
    error: null,
    generating: false,
    finalGenerated: false,
  };
  const emit = () => listeners.forEach((fn) => fn());
  const update = (patch) => {
    state = { ...state, ...patch };
    emit();
  };
  const stop = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const cancelGeneration = () => {
    if (chunkTimer !== null) clearTimeout(chunkTimer);
    chunkTimer = null;
    const resolve = finishJob;
    finishJob = null;
    if (state.generating) update({ generating: false });
    resolve?.(false);
  };
  const fail = (error) => {
    stop();
    update({ playing: false, error: error.message });
  };
  function advance() {
    if (!iterator) return false;
    if (state.index + 1 < frames.length) {
      const index = state.index + 1,
        snapshot = frames[index];
      const atCachedEnd =
        snapshot.status === "complete" ||
        (state.complete && index === frames.length - 1);
      if (atCachedEnd) stop();
      update({ index, snapshot, ...(atCachedEnd ? { playing: false } : {}) });
      return true;
    }
    // Errors stop new generation, not exact navigation through existing cached states.
    if (state.complete || state.error) {
      stop();
      if (state.playing) update({ playing: false });
      return false;
    }
    try {
      const result = iterator.next();
      if (result.done) {
        update({ complete: true, playing: false });
        stop();
        return false;
      }
      if (frames.length >= maxSnapshots)
        throw new Error(
          `Snapshot cache limit (${maxSnapshots}) reached. Use a smaller input.`,
        );
      const snapshot = createSnapshot(result.value);
      frames.push(snapshot);
      const finalGenerated =
        state.finalGenerated || snapshot.status === "complete";
      if (snapshot.status === "complete") stop();
      update({
        index: frames.length - 1,
        snapshot,
        generated: frames.length,
        finalGenerated,
        ...(snapshot.status === "complete" ? { playing: false } : {}),
      });
      return true;
    } catch (error) {
      fail(error);
      return false;
    }
  }
  function schedule() {
    stop();
    if (!state.playing || disposed) return;
    timer = setTimeout(() => {
      timer = null;
      if (advance() && state.playing) schedule();
    }, interval / state.speed);
  }
  const pause = () => {
    stop();
    cancelGeneration();
    update({ playing: false });
  };
  function close() {
    stop();
    cancelGeneration();
    try {
      iterator?.return?.();
    } catch {
      /* Cancellation must still clear state. */
    }
    iterator = null;
  }
  return {
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    load(generator, input = [], options = {}) {
      if (disposed) return;
      close();
      frames = [];
      update({
        index: -1,
        snapshot: null,
        playing: false,
        complete: false,
        generated: 0,
        error: null,
        generating: false,
        finalGenerated: false,
      });
      try {
        iterator = generator([...input], structuredClone(options));
        if (typeof iterator?.next !== "function")
          throw new Error("Expected a generator iterator.");
        advance();
      } catch (error) {
        fail(error);
      }
    },
    clear() {
      close();
      frames = [];
      update({
        index: -1,
        snapshot: null,
        playing: false,
        complete: false,
        generated: 0,
        error: null,
        generating: false,
        finalGenerated: false,
      });
    },
    play() {
      if (
        disposed ||
        !iterator ||
        state.error ||
        state.generating ||
        state.snapshot?.status === "complete" ||
        (state.complete && state.index === frames.length - 1)
      )
        return;
      update({ playing: true });
      schedule();
    },
    pause,
    next() {
      pause();
      advance();
    },
    previous() {
      pause();
      if (state.index > 0)
        update({ index: state.index - 1, snapshot: frames[state.index - 1] });
    },
    restart() {
      pause();
      if (frames.length) update({ index: 0, snapshot: frames[0] });
    },
    seek(index) {
      pause();
      if (!Number.isInteger(index) || index < 0) return;
      while (state.index < index && advance()) {
        /* generate only as far as requested */
      }
      if (index < frames.length) update({ index, snapshot: frames[index] });
    },
    end() {
      pause();
      while (advance()) {
        /* explicitly bounded by maxSnapshots */
      }
    },
    endAsync({ batchSize = 64 } = {}) {
      pause();
      if (disposed || !iterator || state.error) return Promise.resolve(false);
      const size = Math.min(
        128,
        Math.max(1, Number.isInteger(batchSize) ? batchSize : 64),
      );
      update({ generating: true });
      return new Promise((resolve) => {
        finishJob = resolve;
        const runChunk = () => {
          chunkTimer = null;
          const started = performance.now();
          for (let count = 0; count < size && state.generating; count++) {
            if (!advance()) break;
            if (performance.now() - started >= 8) break;
          }
          if (!state.generating) return;
          if (
            (state.complete && state.index === frames.length - 1) ||
            state.error
          ) {
            finishJob = null;
            update({ generating: false });
            resolve(state.complete && !state.error);
          } else chunkTimer = setTimeout(runChunk, 0);
        };
        chunkTimer = setTimeout(runChunk, 0);
      });
    },
    setSpeed(speed) {
      if (!Number.isFinite(speed) || speed < 0.25 || speed > 4)
        throw new Error("Speed must be between 0.25× and 4×.");
      update({ speed });
      schedule();
    },
    dispose() {
      close();
      disposed = true;
      listeners.clear();
      state = { ...state, playing: false };
    },
  };
}
