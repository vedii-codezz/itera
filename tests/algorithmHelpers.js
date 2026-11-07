import { expect } from "vitest";

// Independent test utilities: none import algorithm implementation helpers.
export function collect(generate, input, options) {
  const iterator = generate(input, options);
  const frames = [];
  const serialized = [];
  for (let i = 0; i < 20000; i++) {
    const { value, done } = iterator.next();
    if (done) {
      frames.forEach((frame, index) =>
        expect(JSON.stringify(frame)).toBe(serialized[index]),
      );
      return frames;
    }
    frames.push(value);
    serialized.push(JSON.stringify(value));
  }
  throw new Error("Generator did not terminate within the snapshot budget");
}

export function checkFrames(frames, input, pseudocode) {
  expect(frames.length).toBeGreaterThanOrEqual(2);
  expect(frames[0].array).toEqual(input);
  expect(frames[0].status).toBe("ready");
  expect(frames.at(-1).status).toBe("complete");
  expect(frames.at(-1).operation).toBe("complete");
  let previous = {};
  for (const [index, frame] of frames.entries()) {
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.array)).toBe(true);
    expect(Object.isFrozen(frame.variables)).toBe(true);
    expect(Object.isFrozen(frame.metadata)).toBe(true);
    expect(frame.array).toHaveLength(input.length);
    expect(frame.array.every(Number.isFinite)).toBe(true);
    expect(frame.explanation.trim().length).toBeGreaterThan(10);
    expect(Number.isInteger(frame.pseudocodeLine)).toBe(true);
    expect(frame.pseudocodeLine).toBeGreaterThan(0);
    expect(frame.pseudocodeLine).toBeLessThanOrEqual(pseudocode.length);
    expect(pseudocode[frame.pseudocodeLine - 1].id).toBe(frame.operation);
    for (const [label, indices] of Object.entries(frame.highlights)) {
      expect(Array.isArray(indices)).toBe(true);
      // Check every index without allocating three matcher objects per highlighted element.
      expect(
        indices.every((i) => Number.isInteger(i) && i >= 0 && i < input.length),
        `Invalid ${label} highlight in frame ${index}`,
      ).toBe(true);
    }
    expect(
      Object.values(frame.pointers).every(
        (pointer) =>
          Number.isInteger(pointer) && pointer >= -1 && pointer <= input.length,
      ),
      `Invalid pointer in frame ${index}`,
    ).toBe(true);
    expect(frame.metrics.steps).toBe(index + 1);
    expect(
      Object.entries(frame.metrics).every(
        ([name, value]) =>
          Number.isInteger(value) && value >= (previous[name] ?? 0),
      ),
      `Invalid or decreasing metric in frame ${index}`,
    ).toBe(true);
    previous = frame.metrics;
  }
}

export function seededRandom(seed = 1703) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
