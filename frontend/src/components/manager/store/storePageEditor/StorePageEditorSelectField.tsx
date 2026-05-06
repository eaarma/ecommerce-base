"use client";

export function StorePageEditorSelectField({
  label,
  value,
  onChange,
  options,
  error,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
  helperText?: string;
}) {
  return (
    <label className="form-control">
      <span className="label-text mb-2">{label}</span>
      <select
        className={`select select-bordered mt-2 mb-2 w-full ${error ? "select-error" : ""}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText ? (
        <span className="mt-2 text-sm text-base-content/60">{helperText}</span>
      ) : null}
      {error ? <span className="mt-2 text-sm text-error">{error}</span> : null}
    </label>
  );
}
