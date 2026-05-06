"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/axios";
import {
  formatStoreCustomizationDateTime,
  type StoreCustomizationTabProps,
} from "@/components/manager/store/storeCustomizationHeader";
import { mergeShopUpdateRequest } from "@/lib/managerStorePayload";
import { ManagerStoreService } from "@/lib/managerStoreService";
import {
  applyStoreThemeToDocument,
  buildStoreThemeStyle,
  getStoreThemePresetDefinition,
  normalizeHexColor,
  normalizeStoreThemePreset,
  STOREFRONT_THEME_NAME,
  STORE_THEME_PRESET_OPTIONS,
} from "@/lib/storeTheme";
import { DEFAULT_PUBLIC_SHOP } from "@/types/shop";
import type { ManagerShopDto, StoreThemePreset } from "@/types/shop";

type BrandingFieldName = "primaryColor" | "accentColor" | "themeMode";

type BrandingForm = {
  primaryColor: string;
  accentColor: string;
  themeMode: StoreThemePreset;
};

type BrandingFieldErrors = Partial<Record<BrandingFieldName, string>>;

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{6})$/i;

const toBrandingForm = (shop: ManagerShopDto): BrandingForm => ({
  primaryColor: normalizeHexColor(
    shop.primaryColor,
    DEFAULT_PUBLIC_SHOP.primaryColor,
  ),
  accentColor: normalizeHexColor(
    shop.accentColor,
    DEFAULT_PUBLIC_SHOP.accentColor,
  ),
  themeMode: normalizeStoreThemePreset(shop.themeMode),
});

const validateBrandingForm = (form: BrandingForm): BrandingFieldErrors => {
  const errors: BrandingFieldErrors = {};

  if (!HEX_COLOR_PATTERN.test(form.primaryColor)) {
    errors.primaryColor = "Enter a valid 6-digit hex color.";
  }

  if (!HEX_COLOR_PATTERN.test(form.accentColor)) {
    errors.accentColor = "Enter a valid 6-digit hex color.";
  }

  if (
    !STORE_THEME_PRESET_OPTIONS.some(
      (option) => option.value === form.themeMode,
    )
  ) {
    errors.themeMode = "Choose a valid storefront preset.";
  }

  return errors;
};

export default function StoreBrandingTab({
  onHeaderMetaChange,
}: StoreCustomizationTabProps) {
  const [shop, setShop] = useState<ManagerShopDto | null>(null);
  const [form, setForm] = useState<BrandingForm>({
    primaryColor: DEFAULT_PUBLIC_SHOP.primaryColor,
    accentColor: DEFAULT_PUBLIC_SHOP.accentColor,
    themeMode: "LIGHT",
  });
  const [initialForm, setInitialForm] = useState<BrandingForm>({
    primaryColor: DEFAULT_PUBLIC_SHOP.primaryColor,
    accentColor: DEFAULT_PUBLIC_SHOP.accentColor,
    themeMode: "LIGHT",
  });
  const [fieldErrors, setFieldErrors] = useState<BrandingFieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyLoadedShop = useCallback((data: ManagerShopDto) => {
    const nextForm = toBrandingForm(data);

    setShop(data);
    setForm(nextForm);
    setInitialForm(nextForm);
    setFieldErrors({});
    applyStoreThemeToDocument(data);
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
          : "Could not load branding settings. Please sign in with a staff account.",
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
              : "Could not load branding settings. Please sign in with a staff account.",
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
    () =>
      form.primaryColor !== initialForm.primaryColor ||
      form.accentColor !== initialForm.accentColor ||
      form.themeMode !== initialForm.themeMode,
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

  const selectedPreset = getStoreThemePresetDefinition(form.themeMode);
  const previewThemeStyle = buildStoreThemeStyle({
    primaryColor: form.primaryColor,
    accentColor: form.accentColor,
    themeMode: form.themeMode,
  });

  const updateField = (fieldName: BrandingFieldName, value: string) => {
    setError(null);

    setForm((current) => ({
      ...current,
      [fieldName]:
        fieldName === "themeMode"
          ? normalizeStoreThemePreset(value as StoreThemePreset)
          : value.toLowerCase(),
    }));

    setFieldErrors((current) => ({
      ...current,
      [fieldName]: undefined,
    }));
  };

  const handleColorPickerChange = (
    fieldName: Extract<BrandingFieldName, "primaryColor" | "accentColor">,
    value: string,
  ) => {
    updateField(
      fieldName,
      normalizeHexColor(value, DEFAULT_PUBLIC_SHOP[fieldName]),
    );
  };

  const handleReset = () => {
    setForm(initialForm);
    setFieldErrors({});
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!shop) return;

    const normalizedForm = {
      primaryColor: normalizeHexColor(
        form.primaryColor,
        DEFAULT_PUBLIC_SHOP.primaryColor,
      ),
      accentColor: normalizeHexColor(
        form.accentColor,
        DEFAULT_PUBLIC_SHOP.accentColor,
      ),
      themeMode: normalizeStoreThemePreset(form.themeMode),
    } satisfies BrandingForm;
    const nextErrors = validateBrandingForm(normalizedForm);

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted branding fields before saving.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updatedShop = await ManagerStoreService.updateShop(
        mergeShopUpdateRequest(shop, {
          primaryColor: normalizedForm.primaryColor,
          accentColor: normalizedForm.accentColor,
          themeMode: normalizedForm.themeMode,
        }),
      );
      const nextForm = toBrandingForm(updatedShop);

      setShop(updatedShop);
      setForm(nextForm);
      setInitialForm(nextForm);
      setFieldErrors({});
      applyStoreThemeToDocument(updatedShop);

      toast.success("Store branding updated");
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Could not save branding settings. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="store-panel-branding"
      role="tabpanel"
      aria-labelledby="store-tab-branding"
      className="space-y-5"
    >
      {loading && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-10 text-sm text-base-content/60">
          Loading branding settings...
        </div>
      )}

      {!loading && !shop && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-6">
          <p className="text-sm text-error">
            {error ?? "Could not load branding settings."}
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
            {error && (
              <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <div className="border-b border-base-300 p-2">
              <div className="mb-4">
                <h5 className="text-lg font-semibold text-base-content">
                  Store preset
                </h5>
                <p className="mt-1 text-sm text-base-content/60">
                  The preset controls base surfaces, neutral tones, and overall
                  text behavior throughout the storefront.
                </p>
              </div>

              <label className="form-control">
                <span className="label-text mb-1">Preset</span>
                <select
                  className={`select select-bordered w-full mt-2 ${
                    fieldErrors.themeMode ? "select-error" : ""
                  }`}
                  value={form.themeMode}
                  onChange={(event) =>
                    updateField("themeMode", event.target.value)
                  }
                >
                  {STORE_THEME_PRESET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.themeMode && (
                  <span className="mt-1 text-sm text-error">
                    {fieldErrors.themeMode}
                  </span>
                )}
              </label>

              <div className="mt-4 rounded-2xl border border-base-300 bg-base-200/45 p-4 mb-2">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Selected preset
                </p>
                <p className="mt-1 text-lg font-semibold text-base-content">
                  {selectedPreset.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-base-content/65">
                  {selectedPreset.description}
                </p>
              </div>
            </div>

            <div className="border-b border-base-300 p-5">
              <div className="mb-4">
                <h5 className="text-lg font-semibold text-base-content">
                  Custom colors
                </h5>
                <p className="mt-1 text-sm text-base-content/60">
                  These colors drive primary calls to action and accent details
                  while the preset controls the overall shell around them.
                </p>
              </div>

              <div className="grid gap-4">
                <ColorField
                  label="Primary color"
                  description="Buttons, active states, key links, and primary calls to action."
                  value={form.primaryColor}
                  fallbackColor={DEFAULT_PUBLIC_SHOP.primaryColor}
                  error={fieldErrors.primaryColor}
                  onPickerChange={(value) =>
                    handleColorPickerChange("primaryColor", value)
                  }
                  onTextChange={(value) => updateField("primaryColor", value)}
                />

                <ColorField
                  label="Accent color"
                  description="Highlights, accent buttons, and supporting attention cues."
                  value={form.accentColor}
                  fallbackColor={DEFAULT_PUBLIC_SHOP.accentColor}
                  error={fieldErrors.accentColor}
                  onPickerChange={(value) =>
                    handleColorPickerChange("accentColor", value)
                  }
                  onTextChange={(value) => updateField("accentColor", value)}
                />
              </div>
            </div>

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
                {submitting ? "Saving..." : "Save branding"}
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <div
              data-theme={STOREFRONT_THEME_NAME}
              style={previewThemeStyle}
              className="overflow-hidden rounded-[28px] border border-base-300 bg-base-100 shadow-sm"
            >
              <div className="border-b border-base-300 bg-base-200/70 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Live preview
                </p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-lg font-semibold text-base-content">
                      {shop.storeName}
                    </h5>
                    <p className="text-sm text-base-content/65">
                      {selectedPreset.label} preset with custom primary and
                      accent colors.
                    </p>
                  </div>
                  <span className="badge badge-outline">
                    {selectedPreset.label}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="rounded-2xl border border-base-300 bg-base-200/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Storefront atmosphere
                  </p>
                  <h6 className="mt-2 text-xl font-semibold text-base-content">
                    A controlled theme that still feels custom
                  </h6>
                  <p className="mt-2 text-sm leading-6 text-base-content/70">
                    Preset surfaces keep the storefront polished while primary
                    and accent colors shape the brand personality.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" className="btn btn-primary btn-sm">
                      Primary CTA
                    </button>
                    <button type="button" className="btn btn-accent btn-sm">
                      Accent CTA
                    </button>
                    <button type="button" className="btn btn-outline btn-sm">
                      Secondary action
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <PreviewStat
                    label="Base 100"
                    value="Shell"
                    className="bg-base-100"
                  />
                  <PreviewStat
                    label="Base 200"
                    value="Layer"
                    className="bg-base-200"
                  />
                  <PreviewStat
                    label="Base 300"
                    value="Border"
                    className="bg-base-300"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ColorSwatch
                    label="Primary"
                    value={form.primaryColor}
                    color={form.primaryColor}
                    fallbackColor={DEFAULT_PUBLIC_SHOP.primaryColor}
                  />
                  <ColorSwatch
                    label="Accent"
                    value={form.accentColor}
                    color={form.accentColor}
                    fallbackColor={DEFAULT_PUBLIC_SHOP.accentColor}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <p className="text-sm font-semibold text-base-content">
                Presets reshape the storefront shell.
              </p>
              <p className="mt-2 text-sm leading-6 text-base-content/60">
                Header, footer, buttons, cards, and other theme-token-based
                surfaces now pull from these branding settings automatically.
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function ColorField({
  label,
  description,
  value,
  fallbackColor,
  error,
  onPickerChange,
  onTextChange,
}: {
  label: string;
  description: string;
  value: string;
  fallbackColor: string;
  error?: string;
  onPickerChange: (value: string) => void;
  onTextChange: (value: string) => void;
}) {
  return (
    <label className="form-control">
      <span className="label-text mb-1">{label}</span>
      <p className="mb-3 text-sm text-base-content/60">{description}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="color"
          className="h-14 w-full cursor-pointer rounded-xl border border-base-300 bg-base-100 px-1 sm:w-20"
          value={normalizeHexColor(value, fallbackColor)}
          onChange={(event) => onPickerChange(event.target.value)}
        />
        <input
          type="text"
          className={`input input-bordered w-full font-mono ${
            error ? "input-error" : ""
          }`}
          value={value}
          onChange={(event) => onTextChange(event.target.value)}
          maxLength={7}
          placeholder="#0284c7"
        />
      </div>
      {error && <span className="mt-1 text-sm text-error">{error}</span>}
    </label>
  );
}

function PreviewStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className={`rounded-2xl border border-base-300 p-3 ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-base-content/55">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-base-content">{value}</p>
    </div>
  );
}

function ColorSwatch({
  label,
  value,
  color,
  fallbackColor,
}: {
  label: string;
  value: string;
  color: string;
  fallbackColor: string;
}) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-base-content/55">
        {label}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span
          className="h-10 w-10 rounded-xl border border-base-300"
          style={{ backgroundColor: normalizeHexColor(color, fallbackColor) }}
        />
        <span className="font-mono text-sm text-base-content/75">{value}</span>
      </div>
    </div>
  );
}
