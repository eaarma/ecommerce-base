"use client";

export function StorePageEditorTextareaField({
  label,
  value,
  onChange,
  rows,
  maxLength,
  placeholder,
  disabled = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  maxLength: number;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <label className="form-control">
      <span className="label-text mb-2">{label}</span>
      <textarea
        className={`textarea textarea-bordered mt-2 mb-2 w-full ${error ? "textarea-error" : ""}`}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error ? <span className="mt-1 text-sm text-error">{error}</span> : null}
    </label>
  );
}
