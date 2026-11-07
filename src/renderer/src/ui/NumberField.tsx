import { useEffect, useState } from "react";

type Props = {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange(value: number): void;
};

const parse = (raw: string) => (raw.trim() === "" ? NaN : Number(raw.replace(",", ".")));

/**
 * Number input that lets the user type freely ("1", "1,", "1,5") and commits only numbers within range.
 * Out-of-range input is clamped when the field loses focus, never while typing.
 */
export function NumberField({ label, value, unit, min = -Infinity, max = Infinity, step = 1, disabled, onChange }: Props) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText((current) => (parse(current) === value ? current : String(value)));
  }, [value]);

  const edit = (raw: string) => {
    setText(raw);
    const n = parse(raw);
    if (n >= min && n <= max) onChange(n);
  };

  const finish = () => {
    const n = parse(text);
    if (Number.isNaN(n)) return setText(String(value));
    const clamped = Math.min(max, Math.max(min, n));
    if (clamped !== value) onChange(clamped);
    setText(String(clamped));
  };

  return (
    <label className="field">
      <span>{label}</span>
      <div className="number">
        <input
          type="text"
          inputMode="decimal"
          value={text}
          disabled={disabled}
          onChange={(e) => edit(e.target.value)}
          onBlur={finish}
          onKeyDown={(e) => {
            if (e.key === "Enter") finish();
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const n = Math.min(
                max,
                Math.max(min, (Number.isNaN(parse(text)) ? value : parse(text)) + (e.key === "ArrowUp" ? step : -step)),
              );
              const rounded = Math.round(n * 100) / 100;
              setText(String(rounded));
              onChange(rounded);
            }
          }}
        />
        {unit && <em>{unit}</em>}
      </div>
    </label>
  );
}
