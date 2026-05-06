"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  ExternalLink,
  MoreHorizontal,
  PackageOpen,
  ReceiptText,
  RotateCcw,
  Truck,
} from "lucide-react";

import Modal from "@/components/common/Modal";
import OrderRefundModal, {
  type RefundAction,
} from "@/components/manager/orders/OrderRefundModal";
import { OrderService } from "@/lib/orderService";
import type {
  DeliveryCarrier,
  DeliveryStatus,
  OrderItem,
  OrderResponse,
  OrderStatus,
} from "@/types/order";
import type { RefundResponseDto } from "@/types/payment";
import {
  DELIVERY_CARRIER_LABELS,
  DELIVERY_STATUS_LABELS,
  formatDeliveryCarrier,
  formatDeliveryMethod,
  formatDeliveryStatus,
  getDeliveryDestinationLines,
} from "@/utils/delivery";

type OrderDetailsModalProps = {
  order: OrderResponse | null;
  onClose: () => void;
  onRefunded: () => Promise<void>;
};

type ItemOptionsMenu = {
  itemId: number;
  top: number;
  left: number;
};

type DeliveryFormState = {
  status: DeliveryStatus;
  carrier: DeliveryCarrier;
  trackingNumber: string;
  trackingUrl: string;
};

const DELIVERY_STATUS_OPTIONS = Object.keys(
  DELIVERY_STATUS_LABELS,
) as DeliveryStatus[];

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

const formatStatus = (status: string) =>
  status.replace(/_/g, " ").toLowerCase();

const formatDate = (value?: string | null) => {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getCustomerName = (order: OrderResponse) =>
  `${order.customerFirstName} ${order.customerLastName}`.trim();

const getOrderStatusBadgeClass = (status: OrderStatus) => {
  switch (status) {
    case "PAID":
      return "badge-success";
    case "RESERVED":
    case "FINALIZED":
      return "badge-warning";
    case "CANCELLED":
    case "CANCELLED_REFUNDED":
    case "EXPIRED":
    case "PAYMENT_FAILED":
      return "badge-error";
    default:
      return "badge-neutral";
  }
};

const getDeliveryStatusBadgeClass = (status: DeliveryStatus) => {
  switch (status) {
    case "DELIVERED":
      return "badge-success";
    case "READY_TO_SHIP":
      return "badge-info";
    case "SHIPPED":
      return "badge-primary";
    case "CANCELLED":
      return "badge-error";
    default:
      return "badge-warning";
  }
};

const buildDeliveryFormState = (order: OrderResponse): DeliveryFormState => ({
  status: order.delivery.status,
  carrier: order.delivery.carrier,
  trackingNumber: order.delivery.trackingNumber ?? "",
  trackingUrl: order.delivery.trackingUrl ?? "",
});

export default function OrderDetailsModal({
  order,
  onClose,
  onRefunded,
}: OrderDetailsModalProps) {
  const [currentOrder, setCurrentOrder] = useState<OrderResponse | null>(order);
  const [refunds, setRefunds] = useState<RefundResponseDto[]>([]);
  const [refundAction, setRefundAction] = useState<RefundAction | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundQuantity, setRefundQuantity] = useState(1);
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [isOrderOptionsOpen, setIsOrderOptionsOpen] = useState(false);
  const [itemOptionsMenu, setItemOptionsMenu] =
    useState<ItemOptionsMenu | null>(null);
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormState | null>(
    order ? buildDeliveryFormState(order) : null,
  );
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  useEffect(() => {
    if (!order) {
      return;
    }

    let cancelled = false;

    OrderService.getManagerOrderRefunds(order.id)
      .then((data) => {
        if (!cancelled) {
          setRefunds(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRefunds([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [order]);

  const refundedQuantityByItem = useMemo(() => {
    return refunds.reduce<Record<number, number>>((totals, refund) => {
      if (refund.status !== "SUCCEEDED" || refund.orderItemId == null) {
        return totals;
      }

      totals[refund.orderItemId] =
        (totals[refund.orderItemId] ?? 0) + (refund.quantity ?? 0);
      return totals;
    }, {});
  }, [refunds]);

  const refundedAmount = useMemo(() => {
    return refunds.reduce((total, refund) => {
      if (refund.status !== "SUCCEEDED") {
        return total;
      }

      return total + Number(refund.amount);
    }, 0);
  }, [refunds]);

  if (!currentOrder || !deliveryForm) return null;

  const canRefundOrder =
    currentOrder.status === "PAID" ||
    currentOrder.status === "PARTIALLY_REFUNDED";
  const remainingRefundAmount = Math.max(
    Number(currentOrder.total) - refundedAmount,
    0,
  );
  const deliveryLines = getDeliveryDestinationLines(currentOrder.delivery);

  const openItemRefund = (item: OrderItem) => {
    const refundedQuantity = refundedQuantityByItem[item.id] ?? 0;
    const maxQuantity = Math.max(item.quantity - refundedQuantity, 0);

    setRefundAction({ type: "item", item, maxQuantity });
    setRefundQuantity(1);
    setRefundReason("");
    setRefundError(null);
    setItemOptionsMenu(null);
  };

  const openFullRefund = () => {
    setRefundAction({ type: "full" });
    setRefundQuantity(1);
    setRefundReason("");
    setRefundError(null);
    setIsOrderOptionsOpen(false);
  };

  const closeRefundDialog = () => {
    setRefundAction(null);
    setRefundReason("");
    setRefundQuantity(1);
    setRefundError(null);
  };

  const getRefundAmountPreview = () => {
    if (!refundAction) {
      return 0;
    }

    if (refundAction.type === "full") {
      return remainingRefundAmount;
    }

    return Number(refundAction.item.unitPrice) * refundQuantity;
  };

  const toggleItemOptions = (
    itemId: number,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (itemOptionsMenu?.itemId === itemId) {
      setItemOptionsMenu(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 208;
    const menuHeight = 44;

    setItemOptionsMenu({
      itemId,
      left: Math.max(
        8,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      ),
      top: Math.max(8, rect.top - menuHeight - 8),
    });
  };

  const submitRefund = async () => {
    if (!refundAction) return;

    const reason = refundReason.trim();

    if (!reason) {
      setRefundError("Enter a refund reason.");
      return;
    }

    if (
      refundAction.type === "item" &&
      (refundQuantity < 1 || refundQuantity > refundAction.maxQuantity)
    ) {
      setRefundError("Choose a valid refund quantity.");
      return;
    }

    setSubmittingRefund(true);
    setRefundError(null);

    try {
      if (refundAction.type === "full") {
        await OrderService.refundManagerOrder(currentOrder.id, reason);
      } else {
        await OrderService.refundManagerOrderItem(
          currentOrder.id,
          refundAction.item.id,
          refundQuantity,
          reason,
        );
      }

      const [updatedOrder, updatedRefunds] = await Promise.all([
        OrderService.getManagerOrder(currentOrder.id),
        OrderService.getManagerOrderRefunds(currentOrder.id),
      ]);

      setCurrentOrder(updatedOrder);
      setDeliveryForm(buildDeliveryFormState(updatedOrder));
      setRefunds(updatedRefunds);
      closeRefundDialog();
      await onRefunded();
    } catch {
      setRefundError(
        "Refund could not be created. Check Stripe and try again.",
      );
    } finally {
      setSubmittingRefund(false);
    }
  };

  const updateDeliveryField = (
    field: keyof DeliveryFormState,
    value: string | DeliveryCarrier | DeliveryStatus,
  ) => {
    setDeliveryForm((current) =>
      current ? { ...current, [field]: value } : current,
    );
  };

  const submitDeliveryUpdate = async () => {
    setIsUpdatingDelivery(true);
    setDeliveryError(null);

    try {
      const updatedOrder = await OrderService.updateManagerDelivery(
        currentOrder.id,
        {
          status: deliveryForm.status,
          carrier: deliveryForm.carrier,
          trackingNumber: deliveryForm.trackingNumber,
          trackingUrl: deliveryForm.trackingUrl,
        },
      );

      setCurrentOrder(updatedOrder);
      setDeliveryForm(buildDeliveryFormState(updatedOrder));
      await onRefunded();
    } catch {
      setDeliveryError("Delivery update failed. Please try again.");
    } finally {
      setIsUpdatingDelivery(false);
    }
  };

  const itemOptionsOverlay = itemOptionsMenu ? (
    <div
      className="absolute z-20 min-w-52 rounded-lg border border-base-300 bg-base-100 p-1 shadow-lg"
      style={{
        left: itemOptionsMenu.left,
        top: itemOptionsMenu.top,
      }}
    >
      {currentOrder.items
        .filter((item) => item.id === itemOptionsMenu.itemId)
        .map((item) => {
          const refundedQuantity = refundedQuantityByItem[item.id] ?? 0;
          const refundableQuantity = Math.max(
            item.quantity - refundedQuantity,
            0,
          );

          return (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-base-content hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canRefundOrder || refundableQuantity === 0}
              onClick={() => openItemRefund(item)}
            >
              <RotateCcw size={15} aria-hidden="true" />
              Cancel/refund item
            </button>
          );
        })}
    </div>
  ) : null;

  return (
    <>
      <Modal
        isOpen={Boolean(currentOrder)}
        onClose={onClose}
        dismissable={false}
        overlayChildren={itemOptionsOverlay}
      >
        <div className="space-y-5 pt-6">
          <header className="flex flex-col gap-3 pr-10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-base-content">
                Order #{currentOrder.id}
              </h3>
              <p className="text-sm text-base-content/60">
                Created {formatDate(currentOrder.createdAt)}
              </p>
            </div>
            <span
              className={`badge capitalize ${getOrderStatusBadgeClass(
                currentOrder.status,
              )}`}
            >
              {formatStatus(currentOrder.status)}
            </span>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg bg-base-200 p-4">
              <h4 className="font-semibold text-base-content">Customer</h4>
              <div className="mt-3 space-y-1 text-sm text-base-content/70">
                <p>{getCustomerName(currentOrder)}</p>
                <p>{currentOrder.customerEmail}</p>
              </div>
            </section>

            <section className="rounded-lg bg-base-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-base-content">Delivery</h4>
                <span
                  className={`badge ${getDeliveryStatusBadgeClass(
                    currentOrder.delivery.status,
                  )}`}
                >
                  {formatDeliveryStatus(currentOrder.delivery.status)}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-base-content/70">
                <p className="font-medium text-base-content">
                  {currentOrder.delivery.recipientName}
                </p>
                <p>{currentOrder.delivery.recipientEmail}</p>
                {currentOrder.delivery.recipientPhone && (
                  <p>{currentOrder.delivery.recipientPhone}</p>
                )}
                <p className="mt-2">
                  {formatDeliveryMethod(currentOrder.delivery.method)} via{" "}
                  {formatDeliveryCarrier(currentOrder.delivery.carrier)}
                </p>
                {deliveryLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {currentOrder.delivery.trackingNumber && (
                  <p className="mt-2">
                    Tracking number: {currentOrder.delivery.trackingNumber}
                  </p>
                )}
                {currentOrder.delivery.trackingUrl && (
                  <a
                    href={currentOrder.delivery.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open tracking
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-base-300 p-4">
              <h4 className="font-semibold text-base-content">Status</h4>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-base-content/60">Order</span>
                  <span className="capitalize">
                    {formatStatus(currentOrder.status)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-base-content/60">Payment</span>
                  <span>{currentOrder.paidAt ? "Paid" : "Not paid"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-base-content/60">Delivery</span>
                  <span>
                    {formatDeliveryStatus(currentOrder.delivery.status)}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-base-300 p-4">
              <h4 className="font-semibold text-base-content">Timestamps</h4>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-base-content/60">Created</span>
                  <span>{formatDate(currentOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-base-content/60">Finalized</span>
                  <span>{formatDate(currentOrder.finalizedAt)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-base-content/60">Paid</span>
                  <span>{formatDate(currentOrder.paidAt)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-base-content/60">Shipped</span>
                  <span>{formatDate(currentOrder.delivery.shippedAt)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-base-content/60">Delivered</span>
                  <span>{formatDate(currentOrder.delivery.deliveredAt)}</span>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-base-300 p-4">
            <div className="flex items-center gap-2">
              <Truck size={18} aria-hidden="true" />
              <h4 className="font-semibold text-base-content">
                Delivery Management
              </h4>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="form-control">
                <span className="label-text">Delivery status</span>
                <select
                  className="select select-bordered mt-1 w-full"
                  value={deliveryForm.status}
                  onChange={(event) =>
                    updateDeliveryField(
                      "status",
                      event.target.value as DeliveryStatus,
                    )
                  }
                >
                  {DELIVERY_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatDeliveryStatus(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control">
                <span className="label-text">Carrier</span>
                <select
                  className="select select-bordered mt-1 w-full"
                  value={deliveryForm.carrier}
                  onChange={(event) =>
                    updateDeliveryField(
                      "carrier",
                      event.target.value as DeliveryCarrier,
                    )
                  }
                >
                  {(
                    Object.entries(DELIVERY_CARRIER_LABELS) as Array<
                      [DeliveryCarrier, string]
                    >
                  ).map(([carrier, label]) => (
                    <option key={carrier} value={carrier}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control">
                <span className="label-text">Tracking number</span>
                <input
                  type="text"
                  className="input input-bordered mt-1 w-full"
                  value={deliveryForm.trackingNumber}
                  onChange={(event) =>
                    updateDeliveryField("trackingNumber", event.target.value)
                  }
                  placeholder="Optional"
                />
              </label>

              <label className="form-control">
                <span className="label-text">Tracking URL</span>
                <input
                  type="url"
                  className="input input-bordered mt-1 w-full"
                  value={deliveryForm.trackingUrl}
                  onChange={(event) =>
                    updateDeliveryField("trackingUrl", event.target.value)
                  }
                  placeholder="https://..."
                />
              </label>
            </div>

            {deliveryError && (
              <p className="mt-3 text-sm text-error">{deliveryError}</p>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="btn btn-primary"
                disabled={isUpdatingDelivery}
                onClick={submitDeliveryUpdate}
              >
                {isUpdatingDelivery ? "Saving..." : "Save delivery update"}
              </button>
              <p className="text-sm text-base-content/60">
                Use status changes here to mark the order shipped or delivered.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2">
              <PackageOpen size={18} aria-hidden="true" />
              <h4 className="font-semibold text-base-content">Order Items</h4>
            </div>
            <div className="mt-3 overflow-x-auto overflow-y-visible rounded-lg border border-base-300">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Total</th>
                    <th className="w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrder.items.map((item) => {
                    const refundedQuantity =
                      refundedQuantityByItem[item.id] ?? 0;

                    return (
                      <tr key={item.id}>
                        <td className="font-medium">
                          {item.productSnapshotName}
                          {item.variantSnapshotLabel !== "Default" && (
                            <p className="mt-1 text-xs font-normal text-base-content/60">
                              {item.variantSnapshotLabel}
                            </p>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-outline badge-sm capitalize">
                            {formatStatus(item.status)}
                          </span>
                        </td>
                        <td>
                          {item.quantity}
                          {refundedQuantity > 0 && (
                            <span className="ml-1 text-xs text-base-content/60">
                              ({refundedQuantity} refunded)
                            </span>
                          )}
                        </td>
                        <td>
                          {formatMoney(item.unitPrice, currentOrder.currency)}
                        </td>
                        <td className="font-medium">
                          {formatMoney(item.lineTotal, currentOrder.currency)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs gap-1"
                            onClick={(event) =>
                              toggleItemOptions(item.id, event)
                            }
                          >
                            <MoreHorizontal size={14} aria-hidden="true" />
                            Options
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2">
              <ReceiptText size={18} aria-hidden="true" />
              <h4 className="font-semibold text-base-content">
                Refund History
              </h4>
            </div>
            {refunds.length === 0 ? (
              <p className="mt-3 text-sm text-base-content/60">
                No refunds yet.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-lg border border-base-300">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Refund</th>
                      <th>Status</th>
                      <th>Item</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund) => {
                      const refundedItem = currentOrder.items.find(
                        (item) => item.id === refund.orderItemId,
                      );

                      return (
                        <tr key={refund.id}>
                          <td className="font-mono text-xs">
                            {refund.stripeRefundId ?? refund.id}
                          </td>
                          <td>
                            <span className="badge badge-outline badge-sm capitalize">
                              {formatStatus(refund.status)}
                            </span>
                          </td>
                          <td>
                            {refundedItem
                              ? `${refundedItem.productSnapshotName} x${
                                  refund.quantity ?? 1
                                }`
                              : "Full order"}
                          </td>
                          <td className="font-medium">
                            {formatMoney(refund.amount, refund.currency)}
                          </td>
                          <td className="max-w-56 truncate">{refund.reason}</td>
                          <td className="text-sm text-base-content/70">
                            {formatDate(refund.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3 border-t border-base-300 pt-4 pb-2">
            <div className="flex justify-between text-sm text-base-content/70">
              <span>Subtotal</span>
              <span>
                {formatMoney(currentOrder.subtotal, currentOrder.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-base-content/70">
              <span>Shipping</span>
              <span>
                {formatMoney(currentOrder.shippingTotal, currentOrder.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-base-content/70">
              <span>Refunds</span>
              <span>
                {refundedAmount > 0
                  ? `-${formatMoney(refundedAmount, currentOrder.currency)}`
                  : formatMoney(0, currentOrder.currency)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-base-content">
              <span>Total</span>
              <span>
                {formatMoney(remainingRefundAmount, currentOrder.currency)}
              </span>
            </div>
          </section>

          <footer className="sticky bottom-0 z-20 -mx-4 -mb-4 flex items-center justify-between gap-3 border-t border-base-300 bg-base-100 px-4 py-3 sm:-mx-5 sm:-mb-4 sm:px-5">
            <div className="relative">
              <button
                type="button"
                className="btn btn-outline btn-sm gap-2"
                onClick={() => setIsOrderOptionsOpen((current) => !current)}
              >
                <MoreHorizontal size={16} aria-hidden="true" />
                Options
              </button>

              {isOrderOptionsOpen && (
                <div className="absolute bottom-12 left-0 z-30 min-w-64 rounded-lg border border-base-300 bg-base-100 p-1 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canRefundOrder || remainingRefundAmount <= 0}
                    onClick={openFullRefund}
                  >
                    <RotateCcw size={15} aria-hidden="true" />
                    Cancel/refund order
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
            >
              Close
            </button>
          </footer>
        </div>
      </Modal>

      <OrderRefundModal
        order={currentOrder}
        refundAction={refundAction}
        refundAmount={getRefundAmountPreview()}
        refundQuantity={refundQuantity}
        refundReason={refundReason}
        refundError={refundError}
        submitting={submittingRefund}
        onClose={closeRefundDialog}
        onSubmit={submitRefund}
        onQuantityChange={setRefundQuantity}
        onReasonChange={setRefundReason}
      />
    </>
  );
}
