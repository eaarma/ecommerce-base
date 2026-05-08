"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/axios";
import { AboutPageEditor } from "@/components/manager/store/StorePagesTabs/AboutPageEditor";
import { CancellationRefundPageEditor } from "@/components/manager/store/StorePagesTabs/CancellationRefundPageEditor";
import { FaqPageEditor } from "@/components/manager/store/StorePagesTabs/FaqPageEditor";
import { PrivacyPageEditor } from "@/components/manager/store/StorePagesTabs/PrivacyPageEditor";
import { ShippingPageEditor } from "@/components/manager/store/StorePagesTabs/ShippingPageEditor";
import { StorePageEditorSelectField as SelectField } from "@/components/manager/store/storePageEditor/StorePageEditorSelectField";
import { StorePageEditorSummaryRow as SummaryRow } from "@/components/manager/store/storePageEditor/StorePageEditorSummaryRow";
import { TermsPageEditor } from "@/components/manager/store/StorePagesTabs/TermsPageEditor";
import {
  createEmptyFaqItem,
  createEmptyPolicySection,
  type AboutPageForm,
  type FaqPageForm,
  type PageFieldErrors,
  type PolicyPageForm,
  type StorePageEditorForm,
  type StorePageEditorUpdateForm,
} from "@/types/storePageEditorTypes";
import {
  formatStoreCustomizationDateTime,
  type StoreCustomizationTabProps,
} from "@/components/manager/store/storeCustomizationHeader";
import { normalizeOptionalString } from "@/lib/managerStorePayload";
import { ManagerStorePageService } from "@/lib/managerStorePageService";
import type {
  AboutPageContentDto,
  FaqPageContentDto,
  ManagedStorePageSlug,
  PolicyPageContentDto,
  StorePageDto,
  StorePageStatus,
  UpdateStorePageRequestDto,
} from "@/types/storePage";
import { StoreFormCard } from "../storePageEditor/StoreFormCard";

type ManagedPageKind = "about" | "faq" | "policy";

type ManagedPageSpec = {
  slug: ManagedStorePageSlug;
  label: string;
  kind: ManagedPageKind;
  summary: string;
};
type PageMap = Partial<Record<ManagedStorePageSlug, StorePageDto>>;
type PageFormMap = Partial<Record<ManagedStorePageSlug, StorePageEditorForm>>;

const MANAGED_PAGE_SPECS: ManagedPageSpec[] = [
  {
    slug: "about",
    label: "About",
    kind: "about",
    summary: "Brand story, badge cards, and the richer about-page narrative.",
  },
  {
    slug: "privacy",
    label: "Privacy",
    kind: "policy",
    summary: "Structured privacy-policy sections and closing note.",
  },
  {
    slug: "terms",
    label: "Terms",
    kind: "policy",
    summary: "Store terms and conditions with editable sections.",
  },
  {
    slug: "faq",
    label: "FAQ",
    kind: "faq",
    summary: "Frequently asked questions and reusable support answers.",
  },
  {
    slug: "cancellation-refund",
    label: "Refund Policy",
    kind: "policy",
    summary: "Cancellation, return, and refund policy sections.",
  },
  {
    slug: "shipping",
    label: "Shipping Policy",
    kind: "policy",
    summary: "Order processing, delivery, and shipping expectations.",
  },
] as const;

const PAGE_STATUS_OPTIONS: Array<{
  value: StorePageStatus;
  label: string;
  description: string;
}> = [
  {
    value: "PUBLISHED",
    label: "Published",
    description: "Visible through the public store page endpoint.",
  },
  {
    value: "DRAFT",
    label: "Draft",
    description: "Kept in the manager workspace but hidden publicly.",
  },
] as const;

const ABOUT_BADGE_CARD_COUNT = 3;

const getPageSpec = (slug: ManagedStorePageSlug) =>
  MANAGED_PAGE_SPECS.find((page) => page.slug === slug) ??
  MANAGED_PAGE_SPECS[0];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown) => (typeof value === "string" ? value : "");

const readArray = (value: unknown) => (Array.isArray(value) ? value : []);

const toAboutPageForm = (page: StorePageDto): AboutPageForm => {
  const content = isRecord(page.contentJson)
    ? (page.contentJson as AboutPageContentDto)
    : {};
  const badgeCardsSource = readArray(content.badges ?? content.badgeCards);

  return {
    kind: "about",
    status: page.status,
    mainTitle: readString(content.heroTitle ?? content.mainTitle),
    mainDescription: readString(
      content.heroDescription ?? content.mainDescription,
    ),
    badgeCards: Array.from({ length: ABOUT_BADGE_CARD_COUNT }, (_, index) => {
      const nextCard = badgeCardsSource[index];
      const nextCardRecord = isRecord(nextCard) ? nextCard : {};

      return {
        title: readString(nextCardRecord.title),
        description: readString(nextCardRecord.description),
      };
    }),
    secondaryTitle: readString(content.secondaryTitle),
    secondaryDescription: readString(
      content.secondaryBody ?? content.secondaryDescription,
    ),
    finalTitle: readString(content.finalTitle),
    finalDescription: readString(content.finalBody ?? content.finalDescription),
  };
};

const toPolicyPageForm = (page: StorePageDto): PolicyPageForm => {
  const content = isRecord(page.contentJson)
    ? (page.contentJson as PolicyPageContentDto)
    : {};
  const sections = readArray(content.sections)
    .map((section) => {
      const nextSection = isRecord(section) ? section : {};

      return {
        title: readString(nextSection.title),
        body: readString(nextSection.body),
      };
    })
    .filter((section) => section.title || section.body);

  return {
    kind: "policy",
    status: page.status,
    title: page.title,
    description: page.description ?? readString(content.intro),
    sections: sections.length > 0 ? sections : [createEmptyPolicySection()],
    closingNote: page.closingNote ?? "",
  };
};

const toFaqPageForm = (page: StorePageDto): FaqPageForm => {
  const content = isRecord(page.contentJson)
    ? (page.contentJson as FaqPageContentDto)
    : {};
  const items = readArray(content.items)
    .map((item) => {
      const nextItem = isRecord(item) ? item : {};

      return {
        question: readString(nextItem.question),
        answer: readString(nextItem.answer),
      };
    })
    .filter((item) => item.question || item.answer);

  return {
    kind: "faq",
    status: page.status,
    title: page.title,
    description: page.description ?? readString(content.intro),
    items: items.length > 0 ? items : [createEmptyFaqItem()],
    closingNote: page.closingNote ?? "",
  };
};

const toEditorForm = (page: StorePageDto, kind: ManagedPageKind) => {
  if (kind === "about") {
    return toAboutPageForm(page);
  }

  if (kind === "faq") {
    return toFaqPageForm(page);
  }

  return toPolicyPageForm(page);
};

const serializePageForm = (form: StorePageEditorForm) => JSON.stringify(form);

function validatePageForm(form: StorePageEditorForm): PageFieldErrors {
  const errors: PageFieldErrors = {};

  if (!PAGE_STATUS_OPTIONS.some((option) => option.value === form.status)) {
    errors.status = "Choose a valid status.";
  }

  if (form.kind === "about") {
    if (!form.mainTitle.trim()) {
      errors.mainTitle = "Main title is required.";
    }

    if (!form.mainDescription.trim()) {
      errors.mainDescription = "Main description is required.";
    }

    form.badgeCards.forEach((card, index) => {
      if (!card.title.trim()) {
        errors[`badgeCards.${index}.title`] = "Badge title is required.";
      }

      if (!card.description.trim()) {
        errors[`badgeCards.${index}.description`] =
          "Badge description is required.";
      }
    });

    if (!form.secondaryTitle.trim()) {
      errors.secondaryTitle = "Secondary title is required.";
    }

    if (!form.secondaryDescription.trim()) {
      errors.secondaryDescription = "Secondary description is required.";
    }

    if (!form.finalTitle.trim()) {
      errors.finalTitle = "Final title is required.";
    }

    if (!form.finalDescription.trim()) {
      errors.finalDescription = "Final description is required.";
    }

    return errors;
  }

  if (!form.title.trim()) {
    errors.title = "Page title is required.";
  }

  if (!form.description.trim()) {
    errors.description = "Page description is required.";
  }

  if (form.kind === "policy") {
    if (form.sections.length === 0) {
      errors.sections = "Add at least one policy section.";
    }

    form.sections.forEach((section, index) => {
      if (!section.title.trim()) {
        errors[`sections.${index}.title`] = "Section title is required.";
      }

      if (!section.body.trim()) {
        errors[`sections.${index}.body`] = "Section body is required.";
      }
    });

    return errors;
  }

  if (form.items.length === 0) {
    errors.items = "Add at least one FAQ item.";
  }

  form.items.forEach((item, index) => {
    if (!item.question.trim()) {
      errors[`items.${index}.question`] = "Question is required.";
    }

    if (!item.answer.trim()) {
      errors[`items.${index}.answer`] = "Answer is required.";
    }
  });

  return errors;
}

function buildUpdatePayload(
  page: StorePageDto,
  form: StorePageEditorForm,
): UpdateStorePageRequestDto {
  const baseContent = isRecord(page.contentJson) ? { ...page.contentJson } : {};

  if (form.kind === "about") {
    return {
      title: page.title,
      description: page.description,
      contentJson: {
        ...baseContent,
        heroTitle: normalizeOptionalString(form.mainTitle),
        heroDescription: normalizeOptionalString(form.mainDescription),
        badges: form.badgeCards.map((card) => ({
          title: normalizeOptionalString(card.title),
          description: normalizeOptionalString(card.description),
        })),
        secondaryTitle: normalizeOptionalString(form.secondaryTitle),
        secondaryBody: normalizeOptionalString(form.secondaryDescription),
        finalTitle: normalizeOptionalString(form.finalTitle),
        finalBody: normalizeOptionalString(form.finalDescription),
      },
      closingNote: page.closingNote,
      status: form.status,
    };
  }

  if (form.kind === "faq") {
    return {
      title: form.title.trim(),
      description: normalizeOptionalString(form.description),
      contentJson: {
        ...baseContent,
        intro: normalizeOptionalString(form.description),
        items: form.items.map((item) => ({
          question: normalizeOptionalString(item.question),
          answer: normalizeOptionalString(item.answer),
        })),
      },
      closingNote: normalizeOptionalString(form.closingNote),
      status: form.status,
    };
  }

  return {
    title: form.title.trim(),
    description: normalizeOptionalString(form.description),
    contentJson: {
      ...baseContent,
      intro: normalizeOptionalString(form.description),
      sections: form.sections.map((section) => ({
        title: normalizeOptionalString(section.title),
        body: normalizeOptionalString(section.body),
      })),
    },
    closingNote: normalizeOptionalString(form.closingNote),
    status: form.status,
  };
}

export default function StorePagesTab({
  onHeaderMetaChange,
}: StoreCustomizationTabProps) {
  const [activeSlug, setActiveSlug] = useState<ManagedStorePageSlug>("about");
  const [pagesBySlug, setPagesBySlug] = useState<PageMap>({});
  const [initialFormsBySlug, setInitialFormsBySlug] = useState<PageFormMap>({});
  const [formsBySlug, setFormsBySlug] = useState<PageFormMap>({});
  const [missingSlugs, setMissingSlugs] = useState<ManagedStorePageSlug[]>([]);
  const [fieldErrors, setFieldErrors] = useState<PageFieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyLoadedPages = useCallback((pages: StorePageDto[]) => {
    const nextPagesBySlug: PageMap = {};
    const nextFormsBySlug: PageFormMap = {};

    for (const spec of MANAGED_PAGE_SPECS) {
      const matchingPage = pages.find((page) => page.slug === spec.slug);

      if (!matchingPage) {
        continue;
      }

      nextPagesBySlug[spec.slug] = matchingPage;
      nextFormsBySlug[spec.slug] = toEditorForm(matchingPage, spec.kind);
    }

    const unresolvedSlugs = MANAGED_PAGE_SPECS.filter(
      (spec) => !nextPagesBySlug[spec.slug],
    ).map((spec) => spec.slug);

    setPagesBySlug(nextPagesBySlug);
    setFormsBySlug(nextFormsBySlug);
    setInitialFormsBySlug(nextFormsBySlug);
    setMissingSlugs(unresolvedSlugs);
    setFieldErrors({});

    const firstAvailableSlug =
      MANAGED_PAGE_SPECS.find((spec) => nextPagesBySlug[spec.slug])?.slug ??
      "about";
    setActiveSlug((currentSlug) =>
      nextPagesBySlug[currentSlug] ? currentSlug : firstAvailableSlug,
    );
  }, []);

  const loadPages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const pages = await ManagerStorePageService.getPages();
      applyLoadedPages(pages);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Could not load public page settings. Please sign in with a staff account.",
      );
    } finally {
      setLoading(false);
    }
  }, [applyLoadedPages]);

  useEffect(() => {
    let cancelled = false;

    ManagerStorePageService.getPages()
      .then((pages) => {
        if (!cancelled) {
          applyLoadedPages(pages);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Could not load public page settings. Please sign in with a staff account.",
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
  }, [applyLoadedPages]);

  const activeSpec = getPageSpec(activeSlug);
  const activePage = pagesBySlug[activeSlug] ?? null;
  const activeForm = formsBySlug[activeSlug] ?? null;
  const activeInitialForm = initialFormsBySlug[activeSlug] ?? null;

  const dirtySlugs = useMemo(
    () =>
      MANAGED_PAGE_SPECS.flatMap((spec) => {
        const currentForm = formsBySlug[spec.slug];
        const initialForm = initialFormsBySlug[spec.slug];

        if (!currentForm || !initialForm) {
          return [];
        }

        return serializePageForm(currentForm) !== serializePageForm(initialForm)
          ? [spec.slug]
          : [];
      }),
    [formsBySlug, initialFormsBySlug],
  );

  const hasUnsavedChanges = dirtySlugs.length > 0;
  const activePageDirty = dirtySlugs.includes(activeSlug);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    onHeaderMetaChange?.({
      statusBadgeClassName: hasUnsavedChanges ? "badge-warning" : "badge-ghost",
      statusBadgeLabel: hasUnsavedChanges
        ? `${dirtySlugs.length} unsaved page${dirtySlugs.length === 1 ? "" : "s"}`
        : "Saved",
      lastUpdatedLabel: activePage
        ? `Last updated ${formatStoreCustomizationDateTime(activePage.updatedAt)}`
        : null,
    });
  }, [activePage, dirtySlugs.length, hasUnsavedChanges, onHeaderMetaChange]);

  const updateActiveForm = (
    updater: Parameters<StorePageEditorUpdateForm>[0],
  ) => {
    setFormsBySlug((current) => {
      const currentForm = current[activeSlug];
      if (!currentForm) {
        return current;
      }

      return {
        ...current,
        [activeSlug]: updater(currentForm),
      };
    });

    setError(null);
    setFieldErrors({});
  };

  const handleReset = () => {
    if (!activeInitialForm) {
      return;
    }

    setFormsBySlug((current) => ({
      ...current,
      [activeSlug]: activeInitialForm,
    }));
    setFieldErrors({});
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeForm || !activePage) {
      return;
    }

    const nextErrors = validatePageForm(activeForm);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted page fields before saving.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updatedPage = await ManagerStorePageService.updatePage(
        activeSlug,
        buildUpdatePayload(activePage, activeForm),
      );
      const nextForm = toEditorForm(updatedPage, activeSpec.kind);

      setPagesBySlug((current) => ({
        ...current,
        [activeSlug]: updatedPage,
      }));
      setFormsBySlug((current) => ({
        ...current,
        [activeSlug]: nextForm,
      }));
      setInitialFormsBySlug((current) => ({
        ...current,
        [activeSlug]: nextForm,
      }));
      setFieldErrors({});

      toast.success(`${activeSpec.label} page updated`);
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : `Could not save the ${activeSpec.label.toLowerCase()} page. Please try again.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const missingPagesMessage =
    missingSlugs.length > 0
      ? `Some store pages are missing: ${missingSlugs.join(
          ", ",
        )}. Run the latest backend migration if needed.`
      : null;

  return (
    <section
      id="store-panel-pages"
      role="tabpanel"
      aria-labelledby="store-tab-pages"
    >
      <div className="border-b border-base-300 p-4 pt-0 sm:p-4 sm:pt-0 mb-4">
        <label className="form-control sm:hidden">
          <span className="label-text mb-1">Page</span>
          <select
            className="select select-bordered w-full"
            value={activeSlug}
            onChange={(event) => {
              setActiveSlug(event.target.value as ManagedStorePageSlug);
              setFieldErrors({});
              setError(null);
            }}
          >
            {MANAGED_PAGE_SPECS.map((page) => (
              <option
                key={page.slug}
                value={page.slug}
                disabled={!pagesBySlug[page.slug]}
              >
                {page.label}
              </option>
            ))}
          </select>
        </label>

        <div className="hidden flex-wrap gap-2 sm:flex">
          {MANAGED_PAGE_SPECS.map((page) => {
            const isActive = activeSlug === page.slug;
            const isDirty = dirtySlugs.includes(page.slug);
            const pageStatus = pagesBySlug[page.slug]?.status;

            return (
              <button
                key={page.slug}
                type="button"
                className={`btn h-auto min-h-0 rounded-full px-4 py-2 ${
                  isActive ? "btn-primary" : "btn-outline"
                }`}
                onClick={() => {
                  setActiveSlug(page.slug);
                  setFieldErrors({});
                  setError(null);
                }}
                disabled={!pagesBySlug[page.slug]}
              >
                <span>{page.label}</span>
                {pageStatus ? (
                  <span
                    className={`badge badge-xs ${
                      pageStatus === "PUBLISHED"
                        ? "badge-success"
                        : "badge-ghost"
                    }`}
                  >
                    {pageStatus === "PUBLISHED" ? "Live" : "Draft"}
                  </span>
                ) : null}
                {isDirty ? (
                  <span className="badge badge-warning badge-xs">Unsaved</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-10 text-sm text-base-content/60">
          Loading public page settings...
        </div>
      )}

      {!loading && Object.keys(pagesBySlug).length === 0 && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-6">
          <p className="text-sm text-error">
            {error ?? "Could not load the public page settings."}
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm mt-4"
            onClick={() => void loadPages()}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && activePage && activeForm && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {missingPagesMessage && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-base-content">
                {missingPagesMessage}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <StoreFormCard
              title={`${activeSpec.label} page`}
              description={activeSpec.summary}
            >
              <SelectField
                label="Publication status"
                value={activeForm.status}
                onChange={(value) =>
                  updateActiveForm((currentForm) => ({
                    ...currentForm,
                    status: value as StorePageStatus,
                  }))
                }
                options={PAGE_STATUS_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                error={fieldErrors.status}
                helperText={
                  PAGE_STATUS_OPTIONS.find(
                    (option) => option.value === activeForm.status,
                  )?.description
                }
              />
            </StoreFormCard>

            {renderActivePageEditor(
              activeSlug,
              activeForm,
              fieldErrors,
              updateActiveForm,
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleReset}
                disabled={!activePageDirty || submitting}
              >
                Reset changes
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!activePageDirty || submitting}
              >
                {submitting ? "Saving..." : `Save ${activeSpec.label}`}
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Page snapshot
              </p>
              <h5 className="mt-2 text-lg font-semibold text-base-content">
                {activeSpec.label}
              </h5>
              <p className="mt-2 text-sm leading-6 text-base-content/65">
                {activeSpec.summary}
              </p>

              <div className="mt-5 space-y-3 text-sm text-base-content/70">
                <SummaryRow label="Slug" value={activeSlug} />
                <SummaryRow label="Status" value={activeForm.status} />
                <SummaryRow
                  label="Unsaved"
                  value={activePageDirty ? "Yes" : "No"}
                />
                <SummaryRow
                  label="Last updated"
                  value={formatStoreCustomizationDateTime(activePage.updatedAt)}
                />
                <SummaryRow
                  label="Structure"
                  value={describeFormStructure(activeForm)}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <p className="text-sm font-semibold text-base-content">
                Default content comes from the seeded public pages.
              </p>
              <p className="mt-2 text-sm leading-6 text-base-content/60">
                The editor starts from the wide, reusable informational copy
                already built into the store pages backend so new shops have
                sensible legal and informational defaults immediately.
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function renderActivePageEditor(
  activeSlug: ManagedStorePageSlug,
  activeForm: StorePageEditorForm,
  fieldErrors: PageFieldErrors,
  updateForm: StorePageEditorUpdateForm,
) {
  switch (activeSlug) {
    case "about":
      return (
        <AboutPageEditor
          form={activeForm as AboutPageForm}
          fieldErrors={fieldErrors}
          updateForm={updateForm}
        />
      );
    case "privacy":
      return (
        <PrivacyPageEditor
          form={activeForm as PolicyPageForm}
          fieldErrors={fieldErrors}
          updateForm={updateForm}
        />
      );
    case "terms":
      return (
        <TermsPageEditor
          form={activeForm as PolicyPageForm}
          fieldErrors={fieldErrors}
          updateForm={updateForm}
        />
      );
    case "faq":
      return (
        <FaqPageEditor
          form={activeForm as FaqPageForm}
          fieldErrors={fieldErrors}
          updateForm={updateForm}
        />
      );
    case "cancellation-refund":
      return (
        <CancellationRefundPageEditor
          form={activeForm as PolicyPageForm}
          fieldErrors={fieldErrors}
          updateForm={updateForm}
        />
      );
    case "shipping":
      return (
        <ShippingPageEditor
          form={activeForm as PolicyPageForm}
          fieldErrors={fieldErrors}
          updateForm={updateForm}
        />
      );
    default:
      return null;
  }
}

function describeFormStructure(form: StorePageEditorForm) {
  if (form.kind === "about") {
    return `${form.badgeCards.length} badge cards`;
  }

  if (form.kind === "faq") {
    return `${form.items.length} FAQ item${form.items.length === 1 ? "" : "s"}`;
  }

  return `${form.sections.length} section${form.sections.length === 1 ? "" : "s"}`;
}
