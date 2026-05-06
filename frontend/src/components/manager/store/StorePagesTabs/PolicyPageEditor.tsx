"use client";

import { Plus, Trash2 } from "lucide-react";

import { StoreFormCard } from "@/components/manager/store/storePageEditor/StoreFormCard";
import { StorePageEditorTextField as TextField } from "@/components/manager/store/storePageEditor/StorePageEditorTextField";
import { StorePageEditorTextareaField as TextareaField } from "@/components/manager/store/storePageEditor/StorePageEditorTextareaField";
import {
  createEmptyPolicySection,
  type PageFieldErrors,
  type PolicyPageForm,
  type PolicySectionForm,
  type StorePageEditorUpdateForm,
} from "@/types/storePageEditorTypes";

export type PolicyPageEditorProps = {
  form: PolicyPageForm;
  fieldErrors: PageFieldErrors;
  updateForm: StorePageEditorUpdateForm;
};

export function PolicyPageEditor({
  form,
  fieldErrors,
  updateForm,
}: PolicyPageEditorProps) {
  const updateField = (
    fieldName: "title" | "description" | "closingNote",
    value: string,
  ) => {
    updateForm((currentForm) => ({
      ...(currentForm as PolicyPageForm),
      [fieldName]: value,
    }));
  };

  const updateSection = (
    index: number,
    fieldName: keyof PolicySectionForm,
    value: string,
  ) => {
    updateForm((currentForm) => ({
      ...(currentForm as PolicyPageForm),
      sections: (currentForm as PolicyPageForm).sections.map(
        (section, sectionIndex) =>
          sectionIndex === index
            ? {
                ...section,
                [fieldName]: value,
              }
            : section,
      ),
    }));
  };

  const addSection = () => {
    updateForm((currentForm) => ({
      ...(currentForm as PolicyPageForm),
      sections: [
        ...(currentForm as PolicyPageForm).sections,
        createEmptyPolicySection(),
      ],
    }));
  };

  const removeSection = (index: number) => {
    updateForm((currentForm) => ({
      ...(currentForm as PolicyPageForm),
      sections: (currentForm as PolicyPageForm).sections.filter(
        (_, sectionIndex) => sectionIndex !== index,
      ),
    }));
  };

  return (
    <>
      <StoreFormCard
        title="Header"
        description="The visible page title and opening summary."
      >
        <TextField
          label="Title"
          value={form.title}
          onChange={(value) => updateField("title", value)}
          maxLength={255}
          error={fieldErrors.title}
        />

        <div className="mt-2">
          <TextareaField
            label="Description"
            value={form.description}
            onChange={(value) => updateField("description", value)}
            rows={4}
            maxLength={1000}
            error={fieldErrors.description}
          />
        </div>
      </StoreFormCard>

      <StoreFormCard
        title="Policy sections"
        description="Structured sections for legal and informational policy pages."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-base-content/60">
            Add or reorder policy sections as the page evolves.
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={addSection}
          >
            <Plus className="h-4 w-4" />
            Add section
          </button>
        </div>

        {fieldErrors.sections && (
          <p className="text-sm text-error">{fieldErrors.sections}</p>
        )}

        <div className="space-y-4">
          {form.sections.map((section, index) => (
            <div
              key={`policy-section-${index}`}
              className="rounded-2xl border border-base-300 bg-base-200/30 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-base-content">
                  Section {index + 1}
                </p>
                <button
                  type="button"
                  className="btn btn-outline btn-error btn-xs"
                  onClick={() => removeSection(index)}
                  disabled={form.sections.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="grid gap-4">
                <TextField
                  label="Section title"
                  value={section.title}
                  onChange={(value) => updateSection(index, "title", value)}
                  maxLength={255}
                  error={fieldErrors[`sections.${index}.title`]}
                />

                <TextareaField
                  label="Section body"
                  value={section.body}
                  onChange={(value) => updateSection(index, "body", value)}
                  rows={5}
                  maxLength={4000}
                  error={fieldErrors[`sections.${index}.body`]}
                />
              </div>
            </div>
          ))}
        </div>
      </StoreFormCard>

      <StoreFormCard
        title="Closing note"
        description="Optional closing copy shown after the main policy sections."
      >
        <TextareaField
          label="Closing note"
          value={form.closingNote}
          onChange={(value) => updateField("closingNote", value)}
          rows={4}
          maxLength={4000}
        />
      </StoreFormCard>
    </>
  );
}
