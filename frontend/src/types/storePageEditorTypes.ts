"use client";

import type { StorePageStatus } from "@/types/storePage";

export type AboutBadgeCardForm = {
  title: string;
  description: string;
};

export type AboutPageForm = {
  kind: "about";
  status: StorePageStatus;
  mainTitle: string;
  mainDescription: string;
  badgeCards: AboutBadgeCardForm[];
  secondaryTitle: string;
  secondaryDescription: string;
  finalTitle: string;
  finalDescription: string;
};

export type PolicySectionForm = {
  title: string;
  body: string;
};

export type PolicyPageForm = {
  kind: "policy";
  status: StorePageStatus;
  title: string;
  description: string;
  sections: PolicySectionForm[];
  closingNote: string;
};

export type FaqItemForm = {
  question: string;
  answer: string;
};

export type FaqPageForm = {
  kind: "faq";
  status: StorePageStatus;
  title: string;
  description: string;
  items: FaqItemForm[];
  closingNote: string;
};

export type StorePageEditorForm = AboutPageForm | PolicyPageForm | FaqPageForm;

export type PageFieldErrors = Partial<Record<string, string>>;

export type StorePageEditorUpdateForm = (
  updater: (currentForm: StorePageEditorForm) => StorePageEditorForm,
) => void;

export const createEmptyPolicySection = (): PolicySectionForm => ({
  title: "",
  body: "",
});

export const createEmptyFaqItem = (): FaqItemForm => ({
  question: "",
  answer: "",
});
