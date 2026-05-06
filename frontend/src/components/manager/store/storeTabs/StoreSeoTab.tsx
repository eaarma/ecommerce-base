"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/axios";
import { StoreFormCard as FormCard } from "@/components/manager/store/storePageEditor/StoreFormCard";
import { StorePageEditorTextField as TextField } from "@/components/manager/store/storePageEditor/StorePageEditorTextField";
import { StorePageEditorTextareaField as TextareaField } from "@/components/manager/store/storePageEditor/StorePageEditorTextareaField";
import {
  formatStoreCustomizationDateTime,
  type StoreCustomizationTabProps,
} from "@/components/manager/store/storeCustomizationHeader";
import {
  mergeShopUpdateRequest,
  normalizeOptionalString,
} from "@/lib/managerStorePayload";
import { ManagerStoreService } from "@/lib/managerStoreService";
import {
  buildMetadataDescription,
  buildMetadataKeywords,
  buildMetadataTitle,
  resolveMetadataImage,
} from "@/lib/storeSeo";
import { DEFAULT_PUBLIC_SHOP, type ManagerShopDto } from "@/types/shop";

type SeoForm = {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImageUrl: string;
};

type SeoFieldName = keyof SeoForm;
type SeoFieldErrors = Partial<Record<SeoFieldName, string>>;

const EMPTY_SEO_FORM: SeoForm = {
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  ogImageUrl: "",
};

const OG_IMAGE_URL_PLACEHOLDER = "https://example.com/og-image.jpg";

const toSeoForm = (shop: ManagerShopDto): SeoForm => ({
  seoTitle: shop.seoTitle ?? "",
  seoDescription: shop.seoDescription ?? "",
  seoKeywords: shop.seoKeywords ?? "",
  ogImageUrl: shop.ogImageUrl ?? "",
});

const isValidSeoImageUrl = (value: string) => {
  if (!value.trim()) {
    return true;
  }

  if (value.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const validateSeoForm = (form: SeoForm): SeoFieldErrors => {
  const errors: SeoFieldErrors = {};

  if (form.seoTitle.trim().length > 255) {
    errors.seoTitle = "Keep the SEO title under 255 characters.";
  }

  if (form.seoDescription.trim().length > 320) {
    errors.seoDescription =
      "Keep the SEO description under 320 characters for cleaner search snippets.";
  }

  if (form.seoKeywords.trim().length > 500) {
    errors.seoKeywords = "Keep keywords concise and focused.";
  }

  if (!isValidSeoImageUrl(form.ogImageUrl.trim())) {
    errors.ogImageUrl =
      "Enter a valid absolute image URL or a root-relative path such as /og-image.jpg.";
  }

  return errors;
};

export default function StoreSeoTab({
  onHeaderMetaChange,
}: StoreCustomizationTabProps) {
  const [shop, setShop] = useState<ManagerShopDto | null>(null);
  const [form, setForm] = useState<SeoForm>(EMPTY_SEO_FORM);
  const [initialForm, setInitialForm] = useState<SeoForm>(EMPTY_SEO_FORM);
  const [fieldErrors, setFieldErrors] = useState<SeoFieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyLoadedShop = useCallback((data: ManagerShopDto) => {
    const nextForm = toSeoForm(data);

    setShop(data);
    setForm(nextForm);
    setInitialForm(nextForm);
    setFieldErrors({});
  }, []);

  const loadShop = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await ManagerStoreService.getShop();
      applyLoadedShop(data);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Could not load SEO settings. Please sign in with a staff account.",
      );
    } finally {
      setLoading(false);
    }
  }, [applyLoadedShop]);

  useEffect(() => {
    let cancelled = false;

    ManagerStoreService.getShop()
      .then((data) => {
        if (!cancelled) {
          applyLoadedShop(data);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Could not load SEO settings. Please sign in with a staff account.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyLoadedShop]);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    onHeaderMetaChange?.({
      statusBadgeClassName: isDirty ? "badge-warning" : "badge-ghost",
      statusBadgeLabel: isDirty ? "Unsaved changes" : "Saved",
      lastUpdatedLabel: shop
        ? `Last updated ${formatStoreCustomizationDateTime(shop.updatedAt)}`
        : null,
    });
  }, [isDirty, onHeaderMetaChange, shop]);

  const updateField = (fieldName: SeoFieldName, value: string) => {
    setForm((current) => ({
      ...current,
      [fieldName]: value,
    }));
    setError(null);
    setFieldErrors((current) => ({
      ...current,
      [fieldName]: undefined,
    }));
  };

  const handleReset = () => {
    setForm(initialForm);
    setFieldErrors({});
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!shop) return;

    const nextErrors = validateSeoForm(form);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted SEO fields before saving.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updatedShop = await ManagerStoreService.updateShop(
        mergeShopUpdateRequest(shop, {
          seoTitle: normalizeOptionalString(form.seoTitle),
          seoDescription: normalizeOptionalString(form.seoDescription),
          seoKeywords: normalizeOptionalString(form.seoKeywords),
          ogImageUrl: normalizeOptionalString(form.ogImageUrl),
        }),
      );

      applyLoadedShop(updatedShop);
      toast.success("SEO defaults updated");
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Could not save SEO settings. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const previewShop = useMemo(
    () => ({
      ...(shop ?? DEFAULT_PUBLIC_SHOP),
      seoTitle: normalizeOptionalString(form.seoTitle),
      seoDescription: normalizeOptionalString(form.seoDescription),
      seoKeywords: normalizeOptionalString(form.seoKeywords),
      ogImageUrl: normalizeOptionalString(form.ogImageUrl),
    }),
    [form, shop],
  );
  const previewTitle = buildMetadataTitle(previewShop, null);
  const previewDescription = buildMetadataDescription(
    previewShop,
    null,
    previewShop.shortDescription,
  );
  const previewKeywords = buildMetadataKeywords(previewShop.seoKeywords, null);
  const previewImage = resolveMetadataImage(previewShop, null);

  return (
    <section
      id="store-panel-seo"
      role="tabpanel"
      aria-labelledby="store-tab-seo"
      className="space-y-5"
    >
      {loading && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-10 text-sm text-base-content/60">
          Loading SEO settings...
        </div>
      )}

      {!loading && !shop && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-6">
          <p className="text-sm text-error">
            {error ?? "Could not load SEO settings."}
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm mt-4"
            onClick={() => void loadShop()}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && shop && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            ) : null}

            <FormCard
              title="Search defaults"
              description="These values act as the storefront fallback for the homepage, public pages, and products that do not yet define more specific metadata."
            >
              <TextField
                label="Default SEO title"
                value={form.seoTitle}
                onChange={(value) => updateField("seoTitle", value)}
                maxLength={255}
                placeholder={shop.storeName}
                error={fieldErrors.seoTitle}
              />

              <div className="mt-4 mb-2">
                <TextareaField
                  label="SEO description"
                  value={form.seoDescription}
                  onChange={(value) => updateField("seoDescription", value)}
                  rows={4}
                  maxLength={320}
                  placeholder="A concise description of the store for search engines and social previews."
                  error={fieldErrors.seoDescription}
                />
                <div className="mt-2">
                  <TextField
                    label="Keywords"
                    value={form.seoKeywords}
                    onChange={(value) => updateField("seoKeywords", value)}
                    maxLength={500}
                    placeholder="home goods, gifts, handmade, curated store"
                    error={fieldErrors.seoKeywords}
                  />
                </div>
              </div>
            </FormCard>

            <FormCard
              title="Social preview"
              description="Use an image that works well when links are shared on social platforms and messaging apps."
            >
              <div className="mb-2">
                <TextField
                  label="Open Graph image URL"
                  value={form.ogImageUrl}
                  onChange={(value) => updateField("ogImageUrl", value)}
                  maxLength={500}
                  placeholder={OG_IMAGE_URL_PLACEHOLDER}
                  error={fieldErrors.ogImageUrl}
                />
              </div>
            </FormCard>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleReset}
                disabled={!isDirty || submitting}
              >
                Reset changes
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isDirty || submitting}
              >
                {submitting ? "Saving..." : "Save SEO defaults"}
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Metadata preview
              </p>
              <div className="mt-4 rounded-2xl border border-base-300 bg-base-200/35 p-4">
                <p className="text-sm font-semibold text-primary">
                  {previewTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-base-content/70">
                  {previewDescription ||
                    "Add a description to control how the store appears in search and social previews."}
                </p>
              </div>

              <div className="mt-5 space-y-3 text-sm text-base-content/70">
                <PreviewRow label="Resolved title" value={previewTitle} />
                <PreviewRow
                  label="Resolved description"
                  value={previewDescription || "No SEO description set"}
                />
                <PreviewRow
                  label="Keywords"
                  value={previewKeywords?.join(", ") || "No keywords set"}
                />
                <PreviewRow
                  label="Open Graph image"
                  value={previewImage || "No Open Graph image set"}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <p className="text-sm font-semibold text-base-content">
                These defaults are already reused by the storefront.
              </p>
              <p className="mt-2 text-sm leading-6 text-base-content/60">
                The homepage now reads these values directly, and product plus
                public information pages fall back to them when a more specific
                title or description is not available yet.
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
        {label}
      </p>
      <p className="mt-1 break-words leading-6">{value}</p>
    </div>
  );
}
