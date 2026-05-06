"use client";

export function StorePageEditorSummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
        {label}
      </p>
      <p className="mt-1 break-words leading-6">{value}</p>
    </div>
  );
}
