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

/** Number input that lets the user type freely ("1,5", "") and commits only valid numbers. */
export function NumberField({ label, value, unit, min, max, step = 1, disabled, onChange }: Props) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = (raw: string) => {
    setText(raw);
    const n = Number(raw.replace(",", "."));
    if (raw.trim() === "" || Number.isNaN(n)) return;
    onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)));
  };

  return (
    <label className="field">
      <span>{label}</span>
      <div className="number">
        <input
          type="number"
          inputMode="decimal"
          value={text}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setText(String(value))}
        />
        {unit && <em>{unit}</em>}
      </div>
    </label>
  );
}
