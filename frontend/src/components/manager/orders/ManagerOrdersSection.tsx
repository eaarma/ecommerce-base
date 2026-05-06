"use client";

import { useMemo, useState } from "react";

import OrderDetailsModal from "@/components/manager/orders/OrderDetailsModal";
import type { OrderResponse, OrderStatus } from "@/types/order";

type ManagerOrdersSectionProps = {
  orders: OrderResponse[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
};

type OrderTab = "active" | "past" | "all";

const ACTIVE_ORDER_STATUSES = [
  "RESERVED",
  "FINALIZED",
  "PAID",
  "PAYMENT_FAILED",
] as const satisfies readonly OrderStatus[];

const PAST_ORDER_STATUSES = [
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
  "CANCELLED_REFUNDED",
  "PARTIALLY_REFUNDED",
] as const satisfies readonly OrderStatus[];

const ALL_ORDER_STATUSES = [
  "RESERVED",
  "FINALIZED",
  "PAID",
  "PAYMENT_FAILED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
  "CANCELLED_REFUNDED",
  "PARTIALLY_REFUNDED",
] as const satisfies readonly OrderStatus[];

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

const getStatusBadgeClass = (status: OrderStatus) => {
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

const getTabStatuses = (tab: OrderTab): readonly OrderStatus[] => {
  if (tab === "active") return ACTIVE_ORDER_STATUSES;
  if (tab === "past") return PAST_ORDER_STATUSES;
  return ALL_ORDER_STATUSES;
};

export default function ManagerOrdersSection({
  orders,
  loading,
  error,
  onRefresh,
}: ManagerOrdersSectionProps) {
  const [activeTab, setActiveTab] = useState<OrderTab>("active");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(
    null,
  );

  const tabStatuses = useMemo(() => getTabStatuses(activeTab), [activeTab]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const inTab = activeTab === "all" || tabStatuses.includes(order.status);
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      return inTab && matchesStatus;
    });
  }, [activeTab, orders, statusFilter, tabStatuses]);

  const statusOptions = useMemo(() => {
    const presentStatuses = new Set(orders.map((order) => order.status));
    return tabStatuses.filter((status) => presentStatuses.has(status));
  }, [orders, tabStatuses]);

  const handleTabChange = (tab: OrderTab) => {
    setActiveTab(tab);
    setStatusFilter("ALL");
  };

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
        <div className="flex flex-col gap-4 border-b border-base-300 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-base-content">Orders</h2>
            <p className="text-sm text-base-content/60">
              Review active, past, and all customer orders.
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
            {(["active", "past", "all"] as const).map((tab) => (
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
                setStatusFilter(event.target.value as OrderStatus | "ALL")
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
            Loading orders...
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-8 text-sm text-error">{error}</div>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="px-5 py-8 text-sm text-base-content/60">
            No orders found.
          </div>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Created</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">#{order.id}</td>
                    <td>
                      <span
                        className={`badge capitalize ${getStatusBadgeClass(
                          order.status,
                        )}`}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <p className="font-medium text-base-content">
                          {getCustomerName(order)}
                        </p>
                        <p className="text-sm text-base-content/60">
                          {order.customerEmail}
                        </p>
                      </div>
                    </td>
                    <td>{order.items.length}</td>
                    <td className="font-medium">
                      {formatMoney(order.total, order.currency)}
                    </td>
                    <td className="text-sm text-base-content/70">
                      {formatDate(order.createdAt)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => setSelectedOrder(order)}
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

      <OrderDetailsModal
        key={selectedOrder?.id ?? "empty"}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onRefunded={async () => {
          await onRefresh();
        }}
      />
    </>
  );
}
