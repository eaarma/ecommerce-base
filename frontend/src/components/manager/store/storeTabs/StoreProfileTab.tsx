"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/axios";
import ConfirmActionModal from "@/components/common/ConfirmActionModal";
import { StoreFormCard as FormCard } from "@/components/manager/store/storePageEditor/StoreFormCard";
import { StorePageEditorTextField as TextField } from "@/components/manager/store/storePageEditor/StorePageEditorTextField";
import {
  mergeShopUpdateRequest,
  normalizeOptionalString,
} from "@/lib/managerStorePayload";
import { ManagerStoreService } from "@/lib/managerStoreService";
import {
  formatStoreCustomizationDateTime,
  type StoreCustomizationTabProps,
} from "@/components/manager/store/storeCustomizationHeader";
import {
  deleteStoreImageFromFirebase,
  uploadStoreImageToFirebase,
} from "@/lib/storeImageUploadService";
import type { ManagerShopDto } from "@/types/shop";

type ProfileFieldName =
  | "storeName"
  | "tagline"
  | "shortDescription"
  | "longDescription"
  | "logoUrl"
  | "faviconUrl"
  | "contactEmail"
  | "supportEmail"
  | "phoneNumber"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "postalCode"
  | "country"
  | "instagramUrl"
  | "facebookUrl"
  | "tiktokUrl"
  | "xUrl";

type ProfileForm = Record<ProfileFieldName, string>;
type ProfileFieldErrors = Partial<Record<ProfileFieldName, string>>;

const EMPTY_PROFILE_FORM: ProfileForm = {
  storeName: "",
  tagline: "",
  shortDescription: "",
  longDescription: "",
  logoUrl: "",
  faviconUrl: "",
  contactEmail: "",
  supportEmail: "",
  phoneNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  xUrl: "",
};

const PROFILE_FIELD_NAMES = Object.keys(
  EMPTY_PROFILE_FORM,
) as ProfileFieldName[];

const EMAIL_FIELD_NAMES: ProfileFieldName[] = ["contactEmail", "supportEmail"];
const URL_FIELD_NAMES: ProfileFieldName[] = [
  "logoUrl",
  "faviconUrl",
  "instagramUrl",
  "facebookUrl",
  "tiktokUrl",
  "xUrl",
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toProfileForm = (
  shop?: Partial<Record<ProfileFieldName, string | null>> | null,
): ProfileForm => ({
  storeName: shop?.storeName ?? "",
  tagline: shop?.tagline ?? "",
  shortDescription: shop?.shortDescription ?? "",
  longDescription: shop?.longDescription ?? "",
  logoUrl: shop?.logoUrl ?? "",
  faviconUrl: shop?.faviconUrl ?? "",
  contactEmail: shop?.contactEmail ?? "",
  supportEmail: shop?.supportEmail ?? "",
  phoneNumber: shop?.phoneNumber ?? "",
  addressLine1: shop?.addressLine1 ?? "",
  addressLine2: shop?.addressLine2 ?? "",
  city: shop?.city ?? "",
  postalCode: shop?.postalCode ?? "",
  country: shop?.country ?? "",
  instagramUrl: shop?.instagramUrl ?? "",
  facebookUrl: shop?.facebookUrl ?? "",
  tiktokUrl: shop?.tiktokUrl ?? "",
  xUrl: shop?.xUrl ?? "",
});

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const validateProfileForm = (form: ProfileForm): ProfileFieldErrors => {
  const nextErrors: ProfileFieldErrors = {};

  if (!form.storeName.trim()) {
    nextErrors.storeName = "Store name is required.";
  }

  for (const fieldName of EMAIL_FIELD_NAMES) {
    const value = form[fieldName].trim();
    if (value && !emailPattern.test(value)) {
      nextErrors[fieldName] = "Enter a valid email address.";
    }
  }

  for (const fieldName of URL_FIELD_NAMES) {
    const value = form[fieldName].trim();
    if (value && !isValidHttpUrl(value)) {
      nextErrors[fieldName] = "Enter a valid http:// or https:// URL.";
    }
  }

  return nextErrors;
};

export default function StoreProfileTab({
  onHeaderMetaChange,
}: StoreCustomizationTabProps) {
  const [shop, setShop] = useState<ManagerShopDto | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE_FORM);
  const [initialForm, setInitialForm] =
    useState<ProfileForm>(EMPTY_PROFILE_FORM);
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [isLogoRemovalConfirmOpen, setIsLogoRemovalConfirmOpen] = useState(false);
  const [isFaviconRemovalConfirmOpen, setIsFaviconRemovalConfirmOpen] =
    useState(false);
  const [isRemovingLogo, setIsRemovingLogo] = useState(false);
  const [isRemovingFavicon, setIsRemovingFavicon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingLogoStoragePath, setPendingLogoStoragePath] = useState<
    string | null
  >(null);
  const [pendingFaviconStoragePath, setPendingFaviconStoragePath] = useState<
    string | null
  >(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);
  const pendingLogoStoragePathRef = useRef<string | null>(null);
  const pendingFaviconStoragePathRef = useRef<string | null>(null);

  const applyLoadedShop = useCallback((data: ManagerShopDto) => {
    const nextForm = toProfileForm(data);

    setShop(data);
    setForm(nextForm);
    setInitialForm(nextForm);
    setFieldErrors({});
    setPendingLogoStoragePath(null);
    setPendingFaviconStoragePath(null);
    pendingLogoStoragePathRef.current = null;
    pendingFaviconStoragePathRef.current = null;
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
          : "Could not load the store profile. Please sign in with a staff account.",
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
              : "Could not load the store profile. Please sign in with a staff account.",
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
      PROFILE_FIELD_NAMES.some(
        (fieldName) => form[fieldName] !== initialForm[fieldName],
      ),
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

  useEffect(() => {
    pendingLogoStoragePathRef.current = pendingLogoStoragePath;
  }, [pendingLogoStoragePath]);

  useEffect(() => {
    pendingFaviconStoragePathRef.current = pendingFaviconStoragePath;
  }, [pendingFaviconStoragePath]);

  useEffect(() => {
    return () => {
      const currentPendingLogoStoragePath =
        pendingLogoStoragePathRef.current?.trim();
      const currentPendingFaviconStoragePath =
        pendingFaviconStoragePathRef.current?.trim();

      if (currentPendingLogoStoragePath) {
        void deleteStoreImageFromFirebase(currentPendingLogoStoragePath).catch(
          () => undefined,
        );
      }

      if (currentPendingFaviconStoragePath) {
        void deleteStoreImageFromFirebase(
          currentPendingFaviconStoragePath,
        ).catch(() => undefined);
      }
    };
  }, []);

  const previewEmails = useMemo(
    () =>
      Array.from(
        new Set(
          [form.contactEmail.trim(), form.supportEmail.trim()].filter(
            (value): value is string => Boolean(value),
          ),
        ),
      ),
    [form.contactEmail, form.supportEmail],
  );

  const previewAddress = useMemo(() => {
    const locality = [form.postalCode.trim(), form.city.trim()]
      .filter((value) => Boolean(value))
      .join(" ");

    return [
      form.addressLine1.trim(),
      form.addressLine2.trim(),
      locality,
      form.country.trim(),
    ].filter((value): value is string => Boolean(value));
  }, [
    form.addressLine1,
    form.addressLine2,
    form.city,
    form.country,
    form.postalCode,
  ]);

  const previewSocials = useMemo(
    () =>
      [
        { label: "Instagram", value: form.instagramUrl.trim() },
        { label: "Facebook", value: form.facebookUrl.trim() },
        { label: "TikTok", value: form.tiktokUrl.trim() },
        { label: "X", value: form.xUrl.trim() },
      ].filter((item) => Boolean(item.value)),
    [form.facebookUrl, form.instagramUrl, form.tiktokUrl, form.xUrl],
  );

  const updateField = (fieldName: ProfileFieldName, value: string) => {
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

  const clearPendingLogoUpload = useCallback(async () => {
    const currentPendingLogoStoragePath =
      pendingLogoStoragePathRef.current?.trim();

    if (!currentPendingLogoStoragePath) {
      setPendingLogoStoragePath(null);
      pendingLogoStoragePathRef.current = null;
      return;
    }

    pendingLogoStoragePathRef.current = null;
    setPendingLogoStoragePath(null);

    try {
      await deleteStoreImageFromFirebase(currentPendingLogoStoragePath);
    } catch {
      // Ignore cleanup failures for temporary uploads.
    }
  }, []);

  const clearPendingFaviconUpload = useCallback(async () => {
    const currentPendingFaviconStoragePath =
      pendingFaviconStoragePathRef.current?.trim();

    if (!currentPendingFaviconStoragePath) {
      setPendingFaviconStoragePath(null);
      pendingFaviconStoragePathRef.current = null;
      return;
    }

    pendingFaviconStoragePathRef.current = null;
    setPendingFaviconStoragePath(null);

    try {
      await deleteStoreImageFromFirebase(currentPendingFaviconStoragePath);
    } catch {
      // Ignore cleanup failures for temporary uploads.
    }
  }, []);

  const handleLogoPickerOpen = () => {
    if (logoUploading || submitting) {
      return;
    }

    logoInputRef.current?.click();
  };

  const handleFaviconPickerOpen = () => {
    if (faviconUploading || submitting) {
      return;
    }

    faviconInputRef.current?.click();
  };

  const handleLogoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !shop) {
      return;
    }

    setLogoUploading(true);
    setError(null);
    setFieldErrors((current) => ({
      ...current,
      logoUrl: undefined,
    }));

    try {
      const uploadedLogo = await uploadStoreImageToFirebase({
        file,
        shopId: shop.id,
        folder: "logos",
      });

      const previousPendingLogoStoragePath = pendingLogoStoragePathRef.current;
      pendingLogoStoragePathRef.current = uploadedLogo.storagePath;
      setPendingLogoStoragePath(uploadedLogo.storagePath);

      if (previousPendingLogoStoragePath) {
        void deleteStoreImageFromFirebase(previousPendingLogoStoragePath).catch(
          () => undefined,
        );
      }

      updateField("logoUrl", uploadedLogo.imageUrl);
      toast.success("Logo image uploaded");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload the logo image. Please try again.",
      );
    } finally {
      setLogoUploading(false);
    }
  };

  const handleFaviconFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !shop) {
      return;
    }

    setFaviconUploading(true);
    setError(null);
    setFieldErrors((current) => ({
      ...current,
      faviconUrl: undefined,
    }));

    try {
      const uploadedFavicon = await uploadStoreImageToFirebase({
        file,
        shopId: shop.id,
        folder: "favicons",
      });

      const previousPendingFaviconStoragePath =
        pendingFaviconStoragePathRef.current;
      pendingFaviconStoragePathRef.current = uploadedFavicon.storagePath;
      setPendingFaviconStoragePath(uploadedFavicon.storagePath);

      if (previousPendingFaviconStoragePath) {
        void deleteStoreImageFromFirebase(
          previousPendingFaviconStoragePath,
        ).catch(() => undefined);
      }

      updateField("faviconUrl", uploadedFavicon.imageUrl);
      toast.success("Favicon image uploaded");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload the favicon image. Please try again.",
      );
    } finally {
      setFaviconUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (isRemovingLogo) {
      return;
    }

    setIsRemovingLogo(true);

    try {
      await clearPendingLogoUpload();
      updateField("logoUrl", "");
      setIsLogoRemovalConfirmOpen(false);
    } finally {
      setIsRemovingLogo(false);
    }
  };

  const handleRemoveFavicon = async () => {
    if (isRemovingFavicon) {
      return;
    }

    setIsRemovingFavicon(true);

    try {
      await clearPendingFaviconUpload();
      updateField("faviconUrl", "");
      setIsFaviconRemovalConfirmOpen(false);
    } finally {
      setIsRemovingFavicon(false);
    }
  };

  const handleReset = () => {
    void clearPendingLogoUpload();
    void clearPendingFaviconUpload();
    setForm(initialForm);
    setFieldErrors({});
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!shop) return;

    const nextErrors = validateProfileForm(form);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted fields before saving.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updatedShop = await ManagerStoreService.updateShop(
        mergeShopUpdateRequest(shop, {
          storeName: form.storeName.trim(),
          tagline: normalizeOptionalString(form.tagline),
          shortDescription: normalizeOptionalString(form.shortDescription),
          longDescription: normalizeOptionalString(form.longDescription),
          logoUrl: normalizeOptionalString(form.logoUrl),
          faviconUrl: normalizeOptionalString(form.faviconUrl),
          contactEmail: normalizeOptionalString(form.contactEmail),
          supportEmail: normalizeOptionalString(form.supportEmail),
          phoneNumber: normalizeOptionalString(form.phoneNumber),
          addressLine1: normalizeOptionalString(form.addressLine1),
          addressLine2: normalizeOptionalString(form.addressLine2),
          city: normalizeOptionalString(form.city),
          postalCode: normalizeOptionalString(form.postalCode),
          country: normalizeOptionalString(form.country),
          instagramUrl: normalizeOptionalString(form.instagramUrl),
          facebookUrl: normalizeOptionalString(form.facebookUrl),
          tiktokUrl: normalizeOptionalString(form.tiktokUrl),
          xUrl: normalizeOptionalString(form.xUrl),
        }),
      );
      const nextForm = toProfileForm(updatedShop);

      setShop(updatedShop);
      setForm(nextForm);
      setInitialForm(nextForm);
      setFieldErrors({});
      setPendingLogoStoragePath(null);
      setPendingFaviconStoragePath(null);
      pendingLogoStoragePathRef.current = null;
      pendingFaviconStoragePathRef.current = null;

      toast.success("Store profile updated");
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Could not save the store profile. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const storeInitial = form.storeName.trim().charAt(0).toUpperCase() || "S";

  const previewTagline =
    form.tagline.trim() ||
    "Add a tagline to shape the voice of the storefront.";
  const previewDescription =
    form.shortDescription.trim() ||
    "This short description will be used as fallback storefront copy until homepage content is customized.";
  const isAssetUploading = logoUploading || faviconUploading;

  return (
    <section
      id="store-panel-profile"
      role="tabpanel"
      aria-labelledby="store-tab-profile"
      className="space-y-5"
    >
      {loading && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-10 text-sm text-base-content/60">
          Loading store profile...
        </div>
      )}

      {!loading && !shop && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-6">
          <p className="text-sm text-error">
            {error ?? "Could not load the store profile."}
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <FormCard
              title="Identity"
              description="Core store copy and brand assets shown throughout the storefront."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Store name"
                  value={form.storeName}
                  onChange={(value) => updateField("storeName", value)}
                  maxLength={150}
                  error={fieldErrors.storeName}
                  required
                />

                <TextField
                  label="Tagline"
                  value={form.tagline}
                  onChange={(value) => updateField("tagline", value)}
                  maxLength={255}
                  placeholder="Refined essentials for everyday living"
                  error={fieldErrors.tagline}
                />
              </div>

              <div className="grid gap-4">
                <TextareaField
                  label="Short description"
                  value={form.shortDescription}
                  onChange={(value) => updateField("shortDescription", value)}
                  maxLength={500}
                  rows={4}
                  placeholder="A concise summary used for fallback homepage copy and other compact storefront areas."
                  error={fieldErrors.shortDescription}
                />

                <TextareaField
                  label="Long description"
                  value={form.longDescription}
                  onChange={(value) => updateField("longDescription", value)}
                  maxLength={5000}
                  rows={7}
                  placeholder="A richer brand story for future About, homepage, and editorial content."
                  error={fieldErrors.longDescription}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="form-control">
                  <span className="label-text mb-4">Logo image</span>
                  <div className="rounded-2xl border border-base-300 bg-base-200/30 p-4 mt-2">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-100">
                        {form.logoUrl.trim() ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={form.logoUrl.trim()}
                            alt={`${form.storeName.trim() || "Store"} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-semibold text-base-content/60">
                            {storeInitial}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={handleLogoPickerOpen}
                            disabled={isAssetUploading || submitting}
                          >
                            {logoUploading ? "Uploading..." : "Add logo image"}
                          </button>

                          {form.logoUrl.trim() ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setIsLogoRemovalConfirmOpen(true)}
                              disabled={
                                isAssetUploading || submitting || isRemovingLogo
                              }
                            >
                              Remove logo
                            </button>
                          ) : null}
                        </div>

                        <p className="mt-3 text-sm text-base-content/60">
                          Upload JPG, PNG, WebP, GIF, AVIF, or SVG files up to
                          10MB. Save the profile to keep the new logo URL on the
                          store record.
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoFileChange}
                  />
                  {fieldErrors.logoUrl ? (
                    <span className="mt-1 text-sm text-error">
                      {fieldErrors.logoUrl}
                    </span>
                  ) : null}
                </div>

                <div className="form-control">
                  <span className="label-text mb-4">Favicon image</span>
                  <div className="rounded-2xl border border-base-300 bg-base-200/30 p-4 mt-2">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-100">
                        {form.faviconUrl.trim() ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={form.faviconUrl.trim()}
                            alt="Store favicon"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold uppercase text-base-content/45">
                            ico
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={handleFaviconPickerOpen}
                            disabled={isAssetUploading || submitting}
                          >
                            {faviconUploading
                              ? "Uploading..."
                              : "Add favicon image"}
                          </button>

                          {form.faviconUrl.trim() ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setIsFaviconRemovalConfirmOpen(true)}
                              disabled={
                                isAssetUploading ||
                                submitting ||
                                isRemovingFavicon
                              }
                            >
                              Remove favicon
                            </button>
                          ) : null}
                        </div>

                        <p className="mt-3 text-sm text-base-content/60">
                          Upload a small square brand icon for tabs, bookmarks,
                          and browser chrome. Save the profile to keep the new
                          favicon URL on the store record.
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
                    className="hidden"
                    onChange={handleFaviconFileChange}
                  />
                  {fieldErrors.faviconUrl ? (
                    <span className="mt-1 text-sm text-error">
                      {fieldErrors.faviconUrl}
                    </span>
                  ) : null}
                </div>
              </div>
            </FormCard>

            <FormCard
              title="Contact"
              description="Primary inboxes and contact channels used in the storefront and emails."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Contact email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(value) => updateField("contactEmail", value)}
                  maxLength={320}
                  placeholder="hello@shop.com"
                  error={fieldErrors.contactEmail}
                />

                <TextField
                  label="Support email"
                  type="email"
                  value={form.supportEmail}
                  onChange={(value) => updateField("supportEmail", value)}
                  maxLength={320}
                  placeholder="support@shop.com"
                  error={fieldErrors.supportEmail}
                />

                <TextField
                  label="Phone number"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(value) => updateField("phoneNumber", value)}
                  maxLength={50}
                  placeholder="+1 (555) 010-2040"
                  error={fieldErrors.phoneNumber}
                />
              </div>
            </FormCard>

            <FormCard
              title="Address"
              description="Business location details for the contact page and storefront footer."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Address line 1"
                  value={form.addressLine1}
                  onChange={(value) => updateField("addressLine1", value)}
                  maxLength={255}
                  placeholder="42 Orchard Lane"
                  error={fieldErrors.addressLine1}
                />

                <TextField
                  label="Address line 2"
                  value={form.addressLine2}
                  onChange={(value) => updateField("addressLine2", value)}
                  maxLength={255}
                  placeholder="Suite 300"
                  error={fieldErrors.addressLine2}
                />

                <TextField
                  label="City"
                  value={form.city}
                  onChange={(value) => updateField("city", value)}
                  maxLength={150}
                  placeholder="Tallinn"
                  error={fieldErrors.city}
                />

                <TextField
                  label="Postal code"
                  value={form.postalCode}
                  onChange={(value) => updateField("postalCode", value)}
                  maxLength={40}
                  placeholder="10111"
                  error={fieldErrors.postalCode}
                />

                <TextField
                  label="Country"
                  value={form.country}
                  onChange={(value) => updateField("country", value)}
                  maxLength={120}
                  placeholder="Estonia"
                  error={fieldErrors.country}
                />
              </div>
            </FormCard>

            <FormCard
              title="Social links"
              description="Public profile links managers want to surface across the storefront."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Instagram URL"
                  type="url"
                  value={form.instagramUrl}
                  onChange={(value) => updateField("instagramUrl", value)}
                  maxLength={500}
                  placeholder="https://instagram.com/yourshop"
                  error={fieldErrors.instagramUrl}
                />

                <TextField
                  label="Facebook URL"
                  type="url"
                  value={form.facebookUrl}
                  onChange={(value) => updateField("facebookUrl", value)}
                  maxLength={500}
                  placeholder="https://facebook.com/yourshop"
                  error={fieldErrors.facebookUrl}
                />

                <TextField
                  label="TikTok URL"
                  type="url"
                  value={form.tiktokUrl}
                  onChange={(value) => updateField("tiktokUrl", value)}
                  maxLength={500}
                  placeholder="https://tiktok.com/@yourshop"
                  error={fieldErrors.tiktokUrl}
                />

                <TextField
                  label="X URL"
                  type="url"
                  value={form.xUrl}
                  onChange={(value) => updateField("xUrl", value)}
                  maxLength={500}
                  placeholder="https://x.com/yourshop"
                  error={fieldErrors.xUrl}
                />
              </div>
            </FormCard>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleReset}
                disabled={!isDirty || submitting || isAssetUploading}
              >
                Reset changes
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isDirty || submitting || isAssetUploading}
              >
                {submitting ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-200">
                  {form.logoUrl.trim() ? (
                    <div
                      role="img"
                      aria-label={`${form.storeName || "Store"} logo preview`}
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${form.logoUrl.trim()})` }}
                    />
                  ) : (
                    <span className="text-lg font-semibold text-base-content/60">
                      {storeInitial}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    Storefront Preview
                  </p>
                  <h5 className="mt-1 break-words text-lg font-semibold text-base-content">
                    {form.storeName.trim() || "Store name"}
                  </h5>
                  <p className="mt-1 text-sm text-base-content/60">
                    {previewTagline}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200">
                  {form.faviconUrl.trim() ? (
                    <div
                      role="img"
                      aria-label="Favicon preview"
                      className="h-full w-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${form.faviconUrl.trim()})`,
                      }}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-base-content/45">
                      ico
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-base-content/70">
                {previewDescription}
              </p>

              <div className="mt-5 space-y-3 text-sm text-base-content/70">
                <PreviewRow
                  label="Emails"
                  value={
                    previewEmails.length > 0
                      ? previewEmails.join(" / ")
                      : "Add contact or support email"
                  }
                />
                <PreviewRow
                  label="Phone"
                  value={form.phoneNumber.trim() || "Add a phone number"}
                />
                <PreviewRow
                  label="Address"
                  value={
                    previewAddress.length > 0
                      ? previewAddress.join(", ")
                      : "Add a business address"
                  }
                />
              </div>

              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                  Social presence
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {previewSocials.length > 0 ? (
                    previewSocials.map((social) => (
                      <span key={social.label} className="badge badge-outline">
                        {social.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-base-content/50">
                      No social links configured yet.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <p className="text-sm font-semibold text-base-content">
                This profile is already live in the storefront shell.
              </p>
              <p className="mt-2 text-sm leading-6 text-base-content/60">
                Header, footer, contact page, and customer emails all pick up
                the saved shop identity from this record.
              </p>
            </div>
          </aside>
        </div>
      )}
      <ConfirmActionModal
        isOpen={isLogoRemovalConfirmOpen}
        title="Remove logo?"
        description="This removes the current logo from the profile draft. Save the profile to persist the change."
        confirmLabel="Remove logo"
        cancelLabel="Keep logo"
        tone="error"
        isSubmitting={isRemovingLogo}
        onClose={() => !isRemovingLogo && setIsLogoRemovalConfirmOpen(false)}
        onConfirm={() => void handleRemoveLogo()}
      />

      <ConfirmActionModal
        isOpen={isFaviconRemovalConfirmOpen}
        title="Remove favicon?"
        description="This removes the current favicon from the profile draft. Save the profile to persist the change."
        confirmLabel="Remove favicon"
        cancelLabel="Keep favicon"
        tone="error"
        isSubmitting={isRemovingFavicon}
        onClose={() =>
          !isRemovingFavicon && setIsFaviconRemovalConfirmOpen(false)
        }
        onConfirm={() => void handleRemoveFavicon()}
      />
    </section>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  error,
  rows,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows: number;
  maxLength: number;
  placeholder?: string;
}) {
  return (
    <label className="form-control">
      <span className="label-text">{label}</span>
      <textarea
        className={`textarea textarea-bordered w-full mt-2 ${error ? "textarea-error" : ""}`}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
      />
      {error && <span className="mt-1 text-sm text-error">{error}</span>}
    </label>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
        {label}
      </p>
      <p className="mt-1 leading-6 break-words">{value}</p>
    </div>
  );
}
