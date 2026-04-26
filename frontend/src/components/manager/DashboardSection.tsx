"use client";

import type { OrderResponse } from "@/types/order";
import type { PaymentResponseDto } from "@/types/payment";
import type { ProductDto } from "@/types/product";
import ManagerStatCard from "@/components/manager/ManagerStatCard";

type DashboardSectionProps = {
  products: ProductDto[];
  orders: OrderResponse[];
  payments: PaymentResponseDto[];
  loading: boolean;
  error: string | null;
};

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

const formatDate = (value?: string | null) => {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatStatus = (status: string) =>
  status.replace(/_/g, " ").toLowerCase();

const getOrderCustomerName = (order: OrderResponse) =>
  `${order.customerFirstName} ${order.customerLastName}`.trim();

export default function DashboardSection({
  products,
  orders,
  payments,
  loading,
  error,
}: DashboardSectionProps) {
  const succeededPayments = payments.filter(
    (payment) => payment.status === "SUCCEEDED",
  );
  const revenueCurrency = succeededPayments[0]?.currency ?? "EUR";
  const totalRevenue = succeededPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const paidOrders = orders.filter((order) => order.status === "PAID").length;
  const pendingPayments = payments.filter(
    (payment) => payment.status === "PENDING",
  ).length;
  const failedPayments = payments.filter(
    (payment) => payment.status === "FAILED",
  ).length;
  const lowStockProducts = products.filter(
    (product) => product.stockQuantity <= 5 && product.status !== "ARCHIVED",
  ).length;
  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);
  const recentPayments = [...payments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  if (loading) {
    return (
      <div className="rounded-lg border border-base-300 px-5 py-8 text-sm text-base-content/60">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-base-300 px-5 py-8 text-sm text-error">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <ManagerStatCard
          label="Total Revenue"
          value={formatMoney(totalRevenue, revenueCurrency)}
          featured
        />
        <ManagerStatCard label="Total Orders" value={orders.length.toString()} />
        <ManagerStatCard label="Paid Orders" value={paidOrders.toString()} />
        <ManagerStatCard
          label="Pending Payments"
          value={pendingPayments.toString()}
        />
        <ManagerStatCard label="Failed Payments" value={failedPayments.toString()} />
        <ManagerStatCard label="Low Stock" value={lowStockProducts.toString()} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
          <div className="border-b border-base-300 px-5 py-4">
            <h3 className="text-lg font-semibold text-base-content">
              Recent Orders
            </h3>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-sm text-base-content/60">
              No recent orders.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="font-medium">#{order.id}</td>
                      <td>{getOrderCustomerName(order)}</td>
                      <td className="capitalize">{formatStatus(order.status)}</td>
                      <td>{formatMoney(order.total, order.currency)}</td>
                      <td className="text-sm text-base-content/70">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
          <div className="border-b border-base-300 px-5 py-4">
            <h3 className="text-lg font-semibold text-base-content">
              Recent Payments
            </h3>
          </div>

          {recentPayments.length === 0 ? (
            <div className="px-5 py-8 text-sm text-base-content/60">
              No recent payments.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="font-medium">#{payment.orderId}</td>
                      <td className="capitalize">
                        {formatStatus(payment.status)}
                      </td>
                      <td>{formatMoney(payment.amount, payment.currency)}</td>
                      <td className="text-sm text-base-content/70">
                        {formatDate(payment.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
