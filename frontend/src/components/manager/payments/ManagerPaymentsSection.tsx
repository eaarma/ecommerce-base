"use client";

import { useEffect, useMemo, useState } from "react";

import Modal from "@/components/common/Modal";
import { PaymentService } from "@/lib/paymentService";
import type {
  PaymentResponseDto,
  PaymentStatus,
  RefundResponseDto,
} from "@/types/payment";

type ManagerPaymentsSectionProps = {
  payments: PaymentResponseDto[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
};

type PaymentTab = "active" | "completed" | "all";

const ACTIVE_PAYMENT_STATUSES = [
  "PENDING",
] as const satisfies readonly PaymentStatus[];
const COMPLETED_PAYMENT_STATUSES = [
  "SUCCEEDED",
  "SUCCEEDED_REQUIRES_REVIEW",
  "FAILED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const satisfies readonly PaymentStatus[];
const ALL_PAYMENT_STATUSES = [
  "PENDING",
  "SUCCEEDED",
  "SUCCEEDED_REQUIRES_REVIEW",
  "FAILED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const satisfies readonly PaymentStatus[];

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

const getStatusBadgeClass = (status: PaymentStatus) => {
  switch (status) {
    case "SUCCEEDED":
      return "badge-success";
    case "SUCCEEDED_REQUIRES_REVIEW":
      return "badge-warning";
    case "PARTIALLY_REFUNDED":
    case "REFUNDED":
      return "badge-info";
    case "PENDING":
      return "badge-warning";
    case "FAILED":
      return "badge-error";
    default:
      return "badge-neutral";
  }
};

const getTabStatuses = (tab: PaymentTab): readonly PaymentStatus[] => {
  if (tab === "active") return ACTIVE_PAYMENT_STATUSES;
  if (tab === "completed") return COMPLETED_PAYMENT_STATUSES;
  return ALL_PAYMENT_STATUSES;
};

export default function ManagerPaymentsSection({
  payments,
  loading,
  error,
  onRefresh,
}: ManagerPaymentsSectionProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>("active");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">(
    "ALL",
  );
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentResponseDto | null>(null);

  const tabStatuses = useMemo(() => getTabStatuses(activeTab), [activeTab]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const inTab = activeTab === "all" || tabStatuses.includes(payment.status);
      const matchesStatus =
        statusFilter === "ALL" || payment.status === statusFilter;

      return inTab && matchesStatus;
    });
  }, [activeTab, payments, statusFilter, tabStatuses]);

  const statusOptions = useMemo(() => {
    const presentStatuses = new Set(payments.map((payment) => payment.status));
    return tabStatuses.filter((status) => presentStatuses.has(status));
  }, [payments, tabStatuses]);

  const handleTabChange = (tab: PaymentTab) => {
    setActiveTab(tab);
    setStatusFilter("ALL");
  };

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
        <div className="flex flex-col gap-4 border-b border-base-300 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-base-content">
              Payments
            </h2>
            <p className="text-sm text-base-content/60">
              Review Stripe payment attempts and payment outcomes.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm w-full lg:w-auto"
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-base-300 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" className="tabs tabs-boxed w-full lg:w-auto">
            {(["active", "completed", "all"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                className={`tab capitalize ${activeTab === tab ? "tab-active" : ""}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <label className="form-control w-full lg:max-w-64">
            <span className="label-text">Status</span>
            <select
              className="select select-bordered select-sm mt-1 w-full"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as PaymentStatus | "ALL")
              }
            >
              <option value="ALL">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && (
          <div className="px-5 py-8 text-sm text-base-content/60">
            Loading payments...
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-8 text-sm text-error">{error}</div>
        )}

        {!loading && !error && filteredPayments.length === 0 && (
          <div className="px-5 py-8 text-sm text-base-content/60">
            No payments found.
          </div>
        )}

        {!loading && !error && filteredPayments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Created</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="font-mono text-xs">{payment.id}</td>
                    <td>
                      <span
                        className={`badge capitalize ${getStatusBadgeClass(
                          payment.status,
                        )}`}
                      >
                        {formatStatus(payment.status)}
                      </span>
                    </td>
                    <td className="font-medium">#{payment.orderId}</td>
                    <td className="font-medium">
                      {formatMoney(payment.amount, payment.currency)}
                    </td>

                    <td className="text-sm text-base-content/70">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PaymentDetailsModal
        key={selectedPayment?.id ?? "empty"}
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </>
  );
}

function PaymentDetailsModal({
  payment,
  onClose,
}: {
  payment: PaymentResponseDto | null;
  onClose: () => void;
}) {
  const [refunds, setRefunds] = useState<RefundResponseDto[]>([]);

  useEffect(() => {
    if (!payment) {
      return;
    }

    let cancelled = false;

    PaymentService.getManagerPaymentRefunds(payment.id)
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
  }, [payment]);

  if (!payment) return null;

  return (
    <Modal isOpen={Boolean(payment)} onClose={onClose}>
      <div className="space-y-6 pt-6">
        <div className="flex flex-col gap-3 pr-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-base-content">
              Payment
            </h3>
            <p className="mt-1 break-all font-mono text-xs text-base-content/60">
              {payment.id}
            </p>
          </div>
          <span
            className={`badge capitalize ${getStatusBadgeClass(payment.status)}`}
          >
            {formatStatus(payment.status)}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-lg bg-base-200 p-4">
            <h4 className="font-semibold text-base-content">Payment</h4>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-base-content/60">Order</span>
                <span>#{payment.orderId}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-base-content/60">Provider</span>
                <span>{payment.provider}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-base-content/60">Amount</span>
                <span>{formatMoney(payment.amount, payment.currency)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-base-200 p-4">
            <h4 className="font-semibold text-base-content">Timestamps</h4>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-base-content/60">Created</span>
                <span>{formatDate(payment.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-base-content/60">Updated</span>
                <span>{formatDate(payment.updatedAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-base-content/60">Paid</span>
                <span>{formatDate(payment.paidAt)}</span>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-base-300 p-4">
          <h4 className="font-semibold text-base-content">Stripe References</h4>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="text-base-content/60">Payment Intent</p>
              <p className="mt-1 break-all font-mono text-xs">
                {payment.providerPaymentIntentId ?? "Not attached"}
              </p>
            </div>
            <div>
              <p className="text-base-content/60">Charge</p>
              <p className="mt-1 break-all font-mono text-xs">
                {payment.providerChargeId ?? "Not available"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-base-300 p-4">
          <h4 className="font-semibold text-base-content">Refund History</h4>
          {refunds.length === 0 ? (
            <p className="mt-3 text-sm text-base-content/60">No refunds yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Refund</th>
                    <th>Status</th>
                    <th>Scope</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => (
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
                        {refund.orderItemId
                          ? `Item #${refund.orderItemId} x${refund.quantity ?? 1}`
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {(payment.failureCode || payment.failureMessage) && (
          <section
            className={`rounded-lg p-4 ${
              payment.status === "SUCCEEDED_REQUIRES_REVIEW"
                ? "border border-warning/30 bg-warning/10"
                : "border border-error/30 bg-error/5"
            }`}
          >
            <h4
              className={`font-semibold ${
                payment.status === "SUCCEEDED_REQUIRES_REVIEW"
                  ? "text-warning"
                  : "text-error"
              }`}
            >
              {payment.status === "SUCCEEDED_REQUIRES_REVIEW"
                ? "Review Note"
                : "Failure"}
            </h4>
            <div className="mt-3 space-y-2 text-sm">
              {payment.failureCode && (
                <p>
                  <span className="text-base-content/60">Code: </span>
                  {payment.failureCode}
                </p>
              )}
              {payment.failureMessage && <p>{payment.failureMessage}</p>}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
