import { useState } from "react";
import { ArrowRight, Shuffle, RotateCcw } from "lucide-react";
import { Button, Panel } from "../UI.jsx";
import { generateArray, PRESETS } from "../../utils/input.js";
export function InputStudio({
  text,
  onTextChange,
  onApply,
  onCommit,
  onReset,
  error,
  onError,
}) {
  const [length, setLength] = useState("12"),
    [min, setMin] = useState("5"),
    [max, setMax] = useState("95"),
    [preset, setPreset] = useState("Random");
  function generate() {
    try {
      onCommit(
        generateArray({
          length: length === "" ? NaN : Number(length),
          min: min === "" ? NaN : Number(min),
          max: max === "" ? NaN : Number(max),
          preset,
        }),
      );
    } catch (e) {
      onError(e.message);
    }
  }
  return (
    <Panel title="Input studio" eyebrow="01 / PREPARE">
      <form
        noValidate
        className="input-body"
        onSubmit={(e) => {
          e.preventDefault();
          onApply();
        }}
      >
        <label htmlFor="array">
          Your array <span className="muted">Comma-separated integers</span>
        </label>
        <div className="array-row">
          <input
            id="array"
            aria-label="Array values"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "input-error" : "input-help"}
            autoComplete="off"
          />
          <Button
            type="submit"
            icon={ArrowRight}
            variant="primary"
            aria-label="Apply input"
          >
            Apply
          </Button>
        </div>
        <div id="input-help" className="input-help">
          <span>Up to 48 values · −999 to 999 · empty arrays supported</span>
          <button type="button" className="text-button" onClick={onReset}>
            <RotateCcw size={12} />
            Reset input
          </button>
        </div>
        <div className="generation-controls">
          <label>
            Example
            <select value={preset} onChange={(e) => setPreset(e.target.value)}>
              {PRESETS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Length
            <input
              type="number"
              min="0"
              max="48"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
          </label>
          <label>
            Min
            <input
              type="number"
              min="-999"
              max="999"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
          </label>
          <label>
            Max
            <input
              type="number"
              min="-999"
              max="999"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </label>
          <Button
            type="button"
            icon={Shuffle}
            aria-label="Generate input"
            onClick={generate}
          >
            Generate
          </Button>
        </div>
        {error && (
          <p className="error" id="input-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Panel>
  );
}
