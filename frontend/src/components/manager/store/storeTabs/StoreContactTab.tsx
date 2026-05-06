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
import { ManagerStorePageService } from "@/lib/managerStorePageService";
import {
  mergeShopUpdateRequest,
  normalizeOptionalString,
} from "@/lib/managerStorePayload";
import { ManagerStoreService } from "@/lib/managerStoreService";
import type { ManagerShopDto } from "@/types/shop";
import type {
  ContactPageContentDto,
  StorePageDto,
  UpdateStorePageRequestDto,
} from "@/types/storePage";

type ContactForm = {
  contactReceiverEmail: string;
  contactPageTitle: string;
  contactPageDescription: string;
  showClosingNote: boolean;
  closingNote: string;
  businessHours: string;
  showAddress: boolean;
  showPhone: boolean;
  showSupportEmail: boolean;
};

type ContactFieldName =
  | "contactReceiverEmail"
  | "contactPageTitle"
  | "contactPageDescription"
  | "closingNote"
  | "businessHours";

type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

const EMPTY_CONTACT_FORM: ContactForm = {
  contactReceiverEmail: "",
  contactPageTitle: "",
  contactPageDescription: "",
  showClosingNote: false,
  closingNote: "",
  businessHours: "",
  showAddress: true,
  showPhone: true,
  showSupportEmail: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown) => (typeof value === "string" ? value : "");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toContactForm = (
  shop: ManagerShopDto,
  contactPage: StorePageDto<ContactPageContentDto>,
): ContactForm => {
  const content = isRecord(contactPage.contentJson)
    ? (contactPage.contentJson as ContactPageContentDto)
    : {};

  return {
    contactReceiverEmail: shop.contactReceiverEmail ?? "",
    contactPageTitle: contactPage.title ?? "",
    contactPageDescription: readString(
      content.intro ?? contactPage.description,
    ),
    showClosingNote: Boolean(contactPage.closingNote?.trim()),
    closingNote: contactPage.closingNote ?? "",
    businessHours: shop.businessHours ?? "",
    showAddress: shop.showAddress,
    showPhone: shop.showPhone,
    showSupportEmail: shop.showSupportEmail,
  };
};

const validateContactForm = (form: ContactForm): ContactFieldErrors => {
  const nextErrors: ContactFieldErrors = {};

  if (!form.contactPageTitle.trim()) {
    nextErrors.contactPageTitle = "Contact page title is required.";
  }

  if (
    form.contactReceiverEmail.trim() &&
    !emailPattern.test(form.contactReceiverEmail.trim())
  ) {
    nextErrors.contactReceiverEmail = "Enter a valid email address.";
  }

  return nextErrors;
};

function buildContactPagePayload(
  page: StorePageDto<ContactPageContentDto>,
  form: ContactForm,
): UpdateStorePageRequestDto {
  const baseContent = isRecord(page.contentJson) ? { ...page.contentJson } : {};

  return {
    title: form.contactPageTitle.trim(),
    description: normalizeOptionalString(form.contactPageDescription),
    contentJson: {
      ...baseContent,
      intro: normalizeOptionalString(form.contactPageDescription),
    },
    closingNote: form.showClosingNote
      ? normalizeOptionalString(form.closingNote)
      : null,
    status: page.status,
  };
}

export default function StoreContactTab({
  onHeaderMetaChange,
}: StoreCustomizationTabProps) {
  const [shop, setShop] = useState<ManagerShopDto | null>(null);
  const [contactPage, setContactPage] =
    useState<StorePageDto<ContactPageContentDto> | null>(null);
  const [form, setForm] = useState<ContactForm>(EMPTY_CONTACT_FORM);
  const [initialForm, setInitialForm] =
    useState<ContactForm>(EMPTY_CONTACT_FORM);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyLoadedData = useCallback(
    (
      loadedShop: ManagerShopDto,
      loadedContactPage: StorePageDto<ContactPageContentDto>,
    ) => {
      const nextForm = toContactForm(loadedShop, loadedContactPage);

      setShop(loadedShop);
      setContactPage(loadedContactPage);
      setForm(nextForm);
      setInitialForm(nextForm);
      setFieldErrors({});
    },
    [],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [loadedShop, loadedContactPage] = await Promise.all([
        ManagerStoreService.getShop(),
        ManagerStorePageService.getPage("contact") as Promise<
          StorePageDto<ContactPageContentDto>
        >,
      ]);

      applyLoadedData(loadedShop, loadedContactPage);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Could not load the contact settings. Please sign in with a staff account.",
      );
    } finally {
      setLoading(false);
    }
  }, [applyLoadedData]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      ManagerStoreService.getShop(),
      ManagerStorePageService.getPage("contact") as Promise<
        StorePageDto<ContactPageContentDto>
      >,
    ])
      .then(([loadedShop, loadedContactPage]) => {
        if (!cancelled) {
          applyLoadedData(loadedShop, loadedContactPage);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Could not load the contact settings. Please sign in with a staff account.",
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
  }, [applyLoadedData]);

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
    const labels: string[] = [];

    if (shop) {
      labels.push(
        `Shop updated ${formatStoreCustomizationDateTime(shop.updatedAt)}`,
      );
    }

    if (contactPage) {
      labels.push(
        `Page updated ${formatStoreCustomizationDateTime(contactPage.updatedAt)}`,
      );
    }

    onHeaderMetaChange?.({
      statusBadgeClassName: isDirty ? "badge-warning" : "badge-ghost",
      statusBadgeLabel: isDirty ? "Unsaved changes" : "Saved",
      lastUpdatedLabel: labels.length > 0 ? labels.join(" | ") : null,
    });
  }, [contactPage, isDirty, onHeaderMetaChange, shop]);

  const visibleSupportEmail = useMemo(() => {
    if (!shop || !form.showSupportEmail) {
      return null;
    }

    return shop.supportEmail?.trim() || shop.contactEmail?.trim() || null;
  }, [form.showSupportEmail, shop]);

  const visiblePhone = useMemo(() => {
    if (!shop || !form.showPhone) {
      return null;
    }

    return shop.phoneNumber?.trim() || null;
  }, [form.showPhone, shop]);

  const visibleAddress = useMemo(() => {
    if (!shop || !form.showAddress) {
      return [];
    }

    const locality = [shop.city?.trim(), shop.postalCode?.trim()]
      .filter((value): value is string => Boolean(value))
      .join(", ");

    return [
      shop.addressLine1?.trim() || null,
      shop.addressLine2?.trim() || null,
      locality || null,
      shop.country?.trim() || null,
    ].filter((value): value is string => Boolean(value));
  }, [form.showAddress, shop]);

  const updateField = (fieldName: ContactFieldName, value: string) => {
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

  const updateToggle = (
    fieldName:
      | "showAddress"
      | "showPhone"
      | "showSupportEmail"
      | "showClosingNote",
    value: boolean,
  ) => {
    setForm((current) => ({
      ...current,
      [fieldName]: value,
    }));
    setError(null);
  };

  const handleReset = () => {
    setForm(initialForm);
    setFieldErrors({});
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!shop || !contactPage) {
      return;
    }

    const nextErrors = validateContactForm(form);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted contact fields before saving.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const [updatedShop, updatedContactPage] = await Promise.all([
        ManagerStoreService.updateShop(
          mergeShopUpdateRequest(shop, {
            contactReceiverEmail: normalizeOptionalString(
              form.contactReceiverEmail,
            ),
            businessHours: normalizeOptionalString(form.businessHours),
            showAddress: form.showAddress,
            showPhone: form.showPhone,
            showSupportEmail: form.showSupportEmail,
          }),
        ),
        ManagerStorePageService.updatePage(
          "contact",
          buildContactPagePayload(contactPage, form),
        ) as Promise<StorePageDto<ContactPageContentDto>>,
      ]);

      applyLoadedData(updatedShop, updatedContactPage);
      toast.success("Contact settings updated");
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Could not save the contact settings. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="store-panel-contact"
      role="tabpanel"
      aria-labelledby="store-tab-contact"
      className="space-y-5"
    >
      {loading && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-10 text-sm text-base-content/60">
          Loading contact settings...
        </div>
      )}

      {!loading && (!shop || !contactPage) && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-6">
          <p className="text-sm text-error">
            {error ?? "Could not load the contact settings."}
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm mt-4"
            onClick={() => void loadData()}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && shop && contactPage && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            ) : null}

            <FormCard
              title="Message routing"
              description="Choose where contact-form submissions should be delivered. SMTP credentials still stay in backend environment variables."
            >
              <TextField
                label="Contact receiver email"
                type="email"
                value={form.contactReceiverEmail}
                onChange={(value) => updateField("contactReceiverEmail", value)}
                maxLength={320}
                placeholder="owner@shop.com"
                error={fieldErrors.contactReceiverEmail}
              />

              <div className="mt-6">
                <TextareaField
                  label="Business hours"
                  value={form.businessHours}
                  onChange={(value) => updateField("businessHours", value)}
                  rows={4}
                  maxLength={1000}
                  placeholder={"Mon-Fri: 9:00-17:00\nSat: 10:00-14:00"}
                  error={fieldErrors.businessHours}
                />
              </div>
            </FormCard>

            <FormCard
              title="Contact page"
              description="Edit the main title and intro text shown at the top of the public contact page."
            >
              <TextField
                label="Contact page title"
                value={form.contactPageTitle}
                onChange={(value) => updateField("contactPageTitle", value)}
                maxLength={255}
                placeholder="Get in touch"
                error={fieldErrors.contactPageTitle}
                required
              />

              <div className="mt-6">
                <TextareaField
                  label="Contact page description"
                  value={form.contactPageDescription}
                  onChange={(value) =>
                    updateField("contactPageDescription", value)
                  }
                  rows={5}
                  maxLength={1000}
                  placeholder="Tell customers how they can reach you and what kinds of questions the contact form is best for."
                  error={fieldErrors.contactPageDescription}
                />
              </div>

              <div className="mt-6">
                <ToggleField
                  label="Show closing note"
                  description="Display a short note below the public contact details card."
                  checked={form.showClosingNote}
                  onChange={(value) => updateToggle("showClosingNote", value)}
                />
              </div>

              <div className="mt-5">
                <TextareaField
                  label="Closing note"
                  value={form.closingNote}
                  onChange={(value) => updateField("closingNote", value)}
                  rows={4}
                  maxLength={4000}
                  placeholder="Contact details such as support email, phone number, and address continue to come from the main shop profile."
                  error={fieldErrors.closingNote}
                  disabled={!form.showClosingNote}
                />
              </div>
            </FormCard>
            <FormCard
              title="Visibility"
              description="Control which shop contact details are shown publicly on the contact page."
            >
              <ToggleField
                label="Show support email"
                description="Uses the support email first, then falls back to the general contact email from the Profile tab."
                checked={form.showSupportEmail}
                onChange={(value) => updateToggle("showSupportEmail", value)}
              />

              <ToggleField
                label="Show phone"
                description="Uses the phone number configured in the Profile tab."
                checked={form.showPhone}
                onChange={(value) => updateToggle("showPhone", value)}
              />

              <ToggleField
                label="Show address"
                description="Uses the address fields configured in the Profile tab."
                checked={form.showAddress}
                onChange={(value) => updateToggle("showAddress", value)}
              />
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
                {submitting ? "Saving..." : "Save contact settings"}
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Public preview
              </p>
              <h5 className="mt-2 text-lg font-semibold text-base-content">
                {form.contactPageTitle.trim() || "Get in touch"}
              </h5>
              <p className="mt-2 text-sm leading-6 text-base-content/65">
                {form.contactPageDescription.trim() ||
                  "Customers will see this introduction at the top of the contact page."}
              </p>

              <div className="mt-5 space-y-3 text-sm text-base-content/70">
                <PreviewRow
                  label="Visible email"
                  value={
                    visibleSupportEmail ??
                    (form.showSupportEmail
                      ? "Add support or contact email in Profile"
                      : "Hidden")
                  }
                />
                <PreviewRow
                  label="Visible phone"
                  value={
                    visiblePhone ??
                    (form.showPhone ? "Add phone number in Profile" : "Hidden")
                  }
                />
                <PreviewRow
                  label="Visible address"
                  value={
                    visibleAddress.length > 0
                      ? visibleAddress.join(", ")
                      : form.showAddress
                        ? "Add address details in Profile"
                        : "Hidden"
                  }
                />
                <PreviewRow
                  label="Business hours"
                  value={form.businessHours.trim() || "Not shown"}
                />
                <PreviewRow
                  label="Closing note"
                  value={
                    form.showClosingNote
                      ? form.closingNote.trim() || "Add a closing note"
                      : "Hidden"
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <p className="text-sm font-semibold text-base-content">
                SMTP secrets stay outside the manager UI.
              </p>
              <p className="mt-2 text-sm leading-6 text-base-content/60">
                Managers can change public contact information and the receiver
                inbox here, while the actual SMTP username, password, and mail
                provider setup remain in backend environment variables.
              </p>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <p className="text-sm font-semibold text-base-content">
                Underlying visible contact details still come from Profile.
              </p>
              <p className="mt-2 text-sm leading-6 text-base-content/60">
                Support email, general contact email, phone number, and address
                values are edited in the Profile tab. This Contact tab controls
                whether they appear publicly and where form submissions are
                sent.
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-base-300 bg-base-200/20 p-4">
      <div className="min-w-0">
        <p className="font-medium text-base-content">{label}</p>
        <p className="mt-1 text-sm leading-6 text-base-content/60">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        className="toggle toggle-primary mt-1"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
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
