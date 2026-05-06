"use client";

import { useCallback, useState } from "react";

import StoreBrandingTab from "@/components/manager/store/storeTabs/StoreBrandingTab";
import StoreContactTab from "@/components/manager/store/storeTabs/StoreContactTab";
import StoreHomepageTab from "@/components/manager/store/storeTabs/StoreHomepageTab";
import StorePagesTab from "@/components/manager/store/storeTabs/StorePagesTab";
import StoreProfileTab from "@/components/manager/store/storeTabs/StoreProfileTab";
import StoreSeoTab from "@/components/manager/store/storeTabs/StoreSeoTab";
import {
  EMPTY_STORE_CUSTOMIZATION_HEADER_META,
  type StoreCustomizationHeaderMeta,
} from "@/components/manager/store/storeCustomizationHeader";

type StoreCustomizationTabId =
  | "profile"
  | "branding"
  | "homepage"
  | "pages"
  | "contact"
  | "seo";

const storeCustomizationTabs = [
  {
    id: "profile",
    label: "Profile",
    summary:
      "Update the storefront identity used in the header, footer, contact page, and customer-facing emails.",
  },
  {
    id: "branding",
    label: "Branding",
    summary: "Theme, visual styling, and storefront presentation.",
  },
  {
    id: "homepage",
    label: "Homepage",
    summary: "Editable content for the fixed homepage layout sections.",
  },
  {
    id: "pages",
    label: "Pages",
    summary: "Public information pages and reusable storefront copy.",
  },
  {
    id: "contact",
    label: "Contact",
    summary: "Support channels, addresses, and business details.",
  },
  {
    id: "seo",
    label: "SEO",
    summary: "Defaults for metadata, search previews, and indexing text.",
  },
] as const satisfies readonly {
  id: StoreCustomizationTabId;
  label: string;
  summary: string;
}[];

export default function StoreCustomizationSection() {
  const [activeTab, setActiveTab] =
    useState<StoreCustomizationTabId>("profile");
  const [headerMeta, setHeaderMeta] = useState<StoreCustomizationHeaderMeta>(
    EMPTY_STORE_CUSTOMIZATION_HEADER_META,
  );
  const activeTabConfig =
    storeCustomizationTabs.find((tab) => tab.id === activeTab) ??
    storeCustomizationTabs[0];
  const handleHeaderMetaChange = useCallback(
    (nextHeaderMeta: StoreCustomizationHeaderMeta) => {
      setHeaderMeta(nextHeaderMeta);
    },
    [],
  );

  return (
    <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
      <div className="space-y-4 py-4">
        <div
          role="tablist"
          aria-label="Store configuration tabs"
          className="tabs tabs-boxed h-auto flex-wrap"
        >
          {storeCustomizationTabs.map((tab) => (
            <button
              key={tab.id}
              id={`store-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`store-panel-${tab.id}`}
              className={`tab h-auto px-4 py-2 text-sm ${
                activeTab === tab.id ? "tab-active" : ""
              }`}
              onClick={() => {
                setActiveTab(tab.id);
                setHeaderMeta(EMPTY_STORE_CUSTOMIZATION_HEADER_META);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="border-t border-base-300 bg-base-200/40 px-4">
          <div className="border-b border-base-300 px-2 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="mt-1 text-lg font-semibold text-base-content">
                  {activeTabConfig.label}
                </h3>
                <p className="mt-1 text-sm text-base-content/60">
                  {activeTabConfig.summary}
                </p>
              </div>

              {headerMeta.statusBadgeLabel || headerMeta.lastUpdatedLabel ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/55 sm:justify-end">
                  {headerMeta.statusBadgeLabel &&
                  headerMeta.statusBadgeClassName ? (
                    <span
                      className={`badge ${headerMeta.statusBadgeClassName}`}
                    >
                      {headerMeta.statusBadgeLabel}
                    </span>
                  ) : null}
                  {headerMeta.lastUpdatedLabel ? (
                    <span>{headerMeta.lastUpdatedLabel}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-4">
            {activeTab === "profile" && (
              <StoreProfileTab onHeaderMetaChange={handleHeaderMetaChange} />
            )}
            {activeTab === "branding" && (
              <StoreBrandingTab onHeaderMetaChange={handleHeaderMetaChange} />
            )}
            {activeTab === "homepage" && (
              <StoreHomepageTab onHeaderMetaChange={handleHeaderMetaChange} />
            )}
            {activeTab === "pages" && (
              <StorePagesTab onHeaderMetaChange={handleHeaderMetaChange} />
            )}
            {activeTab === "contact" && (
              <StoreContactTab onHeaderMetaChange={handleHeaderMetaChange} />
            )}
            {activeTab === "seo" && (
              <StoreSeoTab onHeaderMetaChange={handleHeaderMetaChange} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
