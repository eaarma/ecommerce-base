"use client";

import type { ReactNode } from "react";

import Modal from "@/components/common/Modal";

type ConfirmActionModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "error" | "primary";
  isSubmitting?: boolean;
  children?: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Keep it",
  tone = "error",
  isSubmitting = false,
  children,
  onClose,
  onConfirm,
}: ConfirmActionModalProps) {
  const confirmButtonClass =
    tone === "error" ? "btn btn-error" : "btn btn-primary";

  return (
    <Modal isOpen={isOpen} onClose={onClose} dismissable={!isSubmitting}>
      <div className="space-y-5 pt-6">
        <div className="pr-10">
          <h3 className="text-xl font-semibold text-base-content">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-base-content/65">
            {description}
          </p>
        </div>

        {children}

        <div className="flex flex-col-reverse gap-3 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmButtonClass}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
