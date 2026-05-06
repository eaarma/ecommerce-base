"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CreditCard,
  LayoutDashboard,
  Store,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const managerNavItems = [
  { href: "/manager", label: "Dashboard", icon: LayoutDashboard },
  { href: "/manager/orders", label: "Orders", icon: BarChart3 },
  { href: "/manager/payments", label: "Payments", icon: CreditCard },
  { href: "/manager/products", label: "Products", icon: Boxes },
  { href: "/manager/store", label: "Store", icon: Store },
  { href: "/manager/users", label: "Users", icon: Users },
] as const;

export default function ManagerShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const nav = (
    <nav aria-label="Manager sections" className="flex flex-col gap-1">
      {managerNavItems.map((item) => {
        const active =
          item.href === "/manager"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-primary text-primary-content"
                : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
            }`}
            onClick={() => setMobileNavOpen(false)}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <main className="bg-base-100 pt-6 pb-20 lg:pt-8 lg:pb-24">
      <section className="mx-auto flex w-full flex-col gap-6">
        <div className="flex items-start justify-start border-b border-base-300 pb-4 lg:hidden">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setMobileNavOpen(true)}
          >
            Menu
          </button>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
          <aside className="hidden p-2 lg:sticky lg:top-24 lg:block">
            {nav}
          </aside>

          <div className="min-w-0 space-y-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold text-base-content">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-base-content/60">{description}</p>
              )}
            </div>

            {children}
          </div>
        </div>
      </section>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close manager menu"
            onClick={() => setMobileNavOpen(false)}
          />

          <aside className="relative h-full w-72 max-w-[85vw] border-r border-base-300 bg-base-100 p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Manager
                </p>
                <p className="text-lg font-semibold text-base-content">Menu</p>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Close manager menu"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {nav}
          </aside>
        </div>
      )}
    </main>
  );
}
