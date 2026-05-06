"use client";

import { StoreFormCard } from "@/components/manager/store/storePageEditor/StoreFormCard";
import { StorePageEditorTextField as TextField } from "@/components/manager/store/storePageEditor/StorePageEditorTextField";
import { StorePageEditorTextareaField as TextareaField } from "@/components/manager/store/storePageEditor/StorePageEditorTextareaField";
import type {
  AboutBadgeCardForm,
  AboutPageForm,
  PageFieldErrors,
  StorePageEditorUpdateForm,
} from "@/types/storePageEditorTypes";

export function AboutPageEditor({
  form,
  fieldErrors,
  updateForm,
}: {
  form: AboutPageForm;
  fieldErrors: PageFieldErrors;
  updateForm: StorePageEditorUpdateForm;
}) {
  const updateField = (
    fieldName:
      | "mainTitle"
      | "mainDescription"
      | "secondaryTitle"
      | "secondaryDescription"
      | "finalTitle"
      | "finalDescription",
    value: string,
  ) => {
    updateForm((currentForm) => ({
      ...(currentForm as AboutPageForm),
      [fieldName]: value,
    }));
  };

  const updateBadgeCard = (
    index: number,
    fieldName: keyof AboutBadgeCardForm,
    value: string,
  ) => {
    updateForm((currentForm) => ({
      ...(currentForm as AboutPageForm),
      badgeCards: (currentForm as AboutPageForm).badgeCards.map(
        (card, cardIndex) =>
          cardIndex === index
            ? {
                ...card,
                [fieldName]: value,
              }
            : card,
      ),
    }));
  };

  return (
    <>
      <StoreFormCard
        title="Main story"
        description="The lead title and supporting copy for the About page."
      >
        <TextField
          label="Main title"
          value={form.mainTitle}
          onChange={(value) => updateField("mainTitle", value)}
          maxLength={255}
          error={fieldErrors.mainTitle}
        />

        <div className="mt-2">
          <TextareaField
            label="Main description"
            value={form.mainDescription}
            onChange={(value) => updateField("mainDescription", value)}
            rows={4}
            maxLength={1000}
            error={fieldErrors.mainDescription}
          />
        </div>
      </StoreFormCard>

      <StoreFormCard
        title="Badge cards"
        description="Three concise cards that explain what makes the store feel distinct."
      >
        <div className="space-y-4">
          {form.badgeCards.map((card, index) => (
            <div
              key={`about-badge-card-${index}`}
              className="rounded-2xl border border-base-300 bg-base-200/30 p-4"
            >
              <div className="mb-4">
                <p className="text-sm font-semibold text-base-content">
                  Badge card {index + 1}
                </p>
              </div>

              <div className="grid gap-4">
                <TextField
                  label="Title"
                  value={card.title}
                  onChange={(value) => updateBadgeCard(index, "title", value)}
                  maxLength={180}
                  error={fieldErrors[`badgeCards.${index}.title`]}
                />

                <TextareaField
                  label="Description"
                  value={card.description}
                  onChange={(value) =>
                    updateBadgeCard(index, "description", value)
                  }
                  rows={3}
                  maxLength={500}
                  error={fieldErrors[`badgeCards.${index}.description`]}
                />
              </div>
            </div>
          ))}
        </div>
      </StoreFormCard>

      <StoreFormCard
        title="Secondary section"
        description="The middle section that deepens the About-page story."
      >
        <TextField
          label="Secondary title"
          value={form.secondaryTitle}
          onChange={(value) => updateField("secondaryTitle", value)}
          maxLength={255}
          error={fieldErrors.secondaryTitle}
        />

        <div className="mt-6">
          <TextareaField
            label="Secondary description"
            value={form.secondaryDescription}
            onChange={(value) => updateField("secondaryDescription", value)}
            rows={4}
            maxLength={2000}
            error={fieldErrors.secondaryDescription}
          />
        </div>
      </StoreFormCard>

      <StoreFormCard
        title="Final section"
        description="A closing headline and final message for the About page."
      >
        <TextField
          label="Final title"
          value={form.finalTitle}
          onChange={(value) => updateField("finalTitle", value)}
          maxLength={255}
          error={fieldErrors.finalTitle}
        />

        <div className="mt-6">
          <TextareaField
            label="Final description"
            value={form.finalDescription}
            onChange={(value) => updateField("finalDescription", value)}
            rows={4}
            maxLength={2000}
            error={fieldErrors.finalDescription}
          />
        </div>
      </StoreFormCard>
    </>
  );
}
