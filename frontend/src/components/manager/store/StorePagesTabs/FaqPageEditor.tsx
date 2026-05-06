"use client";

import { Plus, Trash2 } from "lucide-react";

import { StoreFormCard } from "@/components/manager/store/storePageEditor/StoreFormCard";
import { StorePageEditorTextField as TextField } from "@/components/manager/store/storePageEditor/StorePageEditorTextField";
import { StorePageEditorTextareaField as TextareaField } from "@/components/manager/store/storePageEditor/StorePageEditorTextareaField";
import {
  createEmptyFaqItem,
  type FaqItemForm,
  type FaqPageForm,
  type PageFieldErrors,
  type StorePageEditorUpdateForm,
} from "@/types/storePageEditorTypes";

export function FaqPageEditor({
  form,
  fieldErrors,
  updateForm,
}: {
  form: FaqPageForm;
  fieldErrors: PageFieldErrors;
  updateForm: StorePageEditorUpdateForm;
}) {
  const updateField = (
    fieldName: "title" | "description" | "closingNote",
    value: string,
  ) => {
    updateForm((currentForm) => ({
      ...(currentForm as FaqPageForm),
      [fieldName]: value,
    }));
  };

  const updateItem = (
    index: number,
    fieldName: keyof FaqItemForm,
    value: string,
  ) => {
    updateForm((currentForm) => ({
      ...(currentForm as FaqPageForm),
      items: (currentForm as FaqPageForm).items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [fieldName]: value,
            }
          : item,
      ),
    }));
  };

  const addItem = () => {
    updateForm((currentForm) => ({
      ...(currentForm as FaqPageForm),
      items: [...(currentForm as FaqPageForm).items, createEmptyFaqItem()],
    }));
  };

  const removeItem = (index: number) => {
    updateForm((currentForm) => ({
      ...(currentForm as FaqPageForm),
      items: (currentForm as FaqPageForm).items.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  return (
    <>
      <StoreFormCard
        title="Header"
        description="The FAQ page title and opening summary."
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
        title="FAQ items"
        description="Questions and answers shown in the public FAQ page."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-base-content/60">
            Add, remove, or refine the common support answers shown publicly.
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={addItem}
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>
        </div>

        {fieldErrors.items && (
          <p className="text-sm text-error">{fieldErrors.items}</p>
        )}

        <div className="space-y-4">
          {form.items.map((item, index) => (
            <div
              key={`faq-item-${index}`}
              className="rounded-2xl border border-base-300 bg-base-200/30 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-base-content">
                  FAQ item {index + 1}
                </p>
                <button
                  type="button"
                  className="btn btn-outline btn-error btn-xs"
                  onClick={() => removeItem(index)}
                  disabled={form.items.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="grid gap-4">
                <TextField
                  label="Question"
                  value={item.question}
                  onChange={(value) => updateItem(index, "question", value)}
                  maxLength={255}
                  error={fieldErrors[`items.${index}.question`]}
                />

                <TextareaField
                  label="Answer"
                  value={item.answer}
                  onChange={(value) => updateItem(index, "answer", value)}
                  rows={4}
                  maxLength={4000}
                  error={fieldErrors[`items.${index}.answer`]}
                />
              </div>
            </div>
          ))}
        </div>
      </StoreFormCard>

      <StoreFormCard
        title="Closing note"
        description="Optional closing message shown below the FAQ list."
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
