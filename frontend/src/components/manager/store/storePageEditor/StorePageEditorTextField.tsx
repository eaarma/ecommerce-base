"use client";

export function StorePageEditorTextField({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
  placeholder,
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "email" | "tel" | "text" | "url";
  maxLength: number;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="form-control">
      <span className="label-text mb-1">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        className={`input input-bordered mt-2 w-full ${error ? "input-error" : ""}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
      />
      {error ? <span className="mt-1 text-sm text-error">{error}</span> : null}
    </label>
  );
}
