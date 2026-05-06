"use client";

import type { ReactNode } from "react";

export function StorePageEditorCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
      <div className="mb-4">
        <h5 className="text-lg font-semibold text-base-content">{title}</h5>
        <p className="mt-1 text-sm text-base-content/60">{description}</p>
      </div>

      <div className="space-y-4">{children}</div>
    </div>
  );
}
