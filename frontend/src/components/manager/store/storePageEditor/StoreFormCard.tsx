"use client";

import type { ReactNode } from "react";

export function StoreFormCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-base-300 p-2">
      <div className="mb-4">
        <h5 className="mb-1 text-lg font-semibold text-base-content">
          {title}
        </h5>
        <p className="mt-1 text-sm text-base-content/60">{description}</p>
      </div>

      <div className="space-y-4 mb-4">{children}</div>
    </div>
  );
}
