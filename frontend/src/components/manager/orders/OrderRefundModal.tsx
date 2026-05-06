"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import Modal from "@/components/common/Modal";
import type { OrderItem, OrderResponse } from "@/types/order";

export type RefundAction =
  | { type: "full" }
  | { type: "item"; item: OrderItem; maxQuantity: number };

type OrderRefundModalProps = {
  order: OrderResponse;
  refundAction: RefundAction | null;
  refundAmount: number;
  refundQuantity: number;
  refundReason: string;
  refundError: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onQuantityChange: (quantity: number) => void;
  onReasonChange: (reason: string) => void;
};

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

export default function OrderRefundModal({
  order,
  refundAction,
  refundAmount,
  refundQuantity,
  refundReason,
  refundError,
  submitting,
  onClose,
  onSubmit,
  onQuantityChange,
  onReasonChange,
}: OrderRefundModalProps) {
  if (!refundAction) return null;

  return (
    <Modal
      isOpen={Boolean(refundAction)}
      onClose={onClose}
      dismissable={!submitting}
    >
      <div className="space-y-5 pt-6">
        <div className="pr-10">
          <h3 className="text-xl font-semibold text-base-content">
            {refundAction.type === "full"
              ? "Cancel/refund order"
              : "Cancel/refund item"}
          </h3>
          <p className="mt-1 text-sm text-base-content/60">
            {refundAction.type === "full"
              ? `Refund ${formatMoney(refundAmount, order.currency)} for order #${order.id}.`
              : `${refundAction.item.productSnapshotName} for ${formatMoney(
                  refundAmount,
                  order.currency,
                )}.`}
          </p>
        </div>

        <div className="rounded-lg border border-base-300 bg-base-200 p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-base-content/60">Refund amount</span>
            <span className="text-lg font-semibold text-base-content">
              {formatMoney(refundAmount, order.currency)}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          {refundAction.type === "item" && (
            <label className="form-control">
              <span className="mb-1 block text-left text-sm font-medium text-base-content">
                Quantity
              </span>
              <input
                type="number"
                className="input input-bordered input-sm"
                min={1}
                max={refundAction.maxQuantity}
                value={refundQuantity}
                onChange={(event) => onQuantityChange(Number(event.target.value))}
              />
            </label>
          )}

          <label
            className={`form-control ${
              refundAction.type === "full" ? "md:col-span-2" : ""
            }`}
          >
            <span className="mb-1 block text-left text-sm font-medium text-base-content">
              Reason
            </span>
            <textarea
              className="textarea textarea-bordered min-h-28"
              value={refundReason}
              onChange={(event) => onReasonChange(event.target.value)}
            />
          </label>
        </div>

        {refundError && (
          <div className="flex items-center gap-2 text-sm text-error">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{refundError}</span>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-error btn-sm gap-2"
            onClick={onSubmit}
            disabled={submitting}
          >
            <RotateCcw size={16} aria-hidden="true" />
            {submitting ? "Refunding..." : "Confirm refund"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
