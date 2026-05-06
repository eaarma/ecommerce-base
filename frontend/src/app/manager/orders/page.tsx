"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ManagerOrdersSection from "@/components/manager/orders/ManagerOrdersSection";
import ManagerShell from "@/components/manager/layout/ManagerShell";
import ManagerStatCard from "@/components/manager/shared/ManagerStatCard";
import { OrderService } from "@/lib/orderService";
import type { OrderResponse } from "@/types/order";

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await OrderService.getManagerOrders();
      setOrders(data);
    } catch {
      setError("Could not load orders. Please sign in with a staff account.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    OrderService.getManagerOrders()
      .then((data) => {
        if (!cancelled) {
          setOrders(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load orders. Please sign in with a staff account.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const paidOrders = useMemo(
    () => orders.filter((order) => order.status === "PAID").length,
    [orders],
  );
  const reservedOrders = useMemo(
    () => orders.filter((order) => order.status === "RESERVED").length,
    [orders],
  );
  const endedOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "EXPIRED" || order.status === "CANCELLED",
      ).length,
    [orders],
  );

  return (
    <ManagerShell
      title="Orders"
      description="Order-specific operational status and customer order details."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagerStatCard label="Total Orders" value={orders.length.toString()} />
        <ManagerStatCard label="Paid Orders" value={paidOrders.toString()} />
        <ManagerStatCard label="Reserved Orders" value={reservedOrders.toString()} />
        <ManagerStatCard label="Expired / Cancelled" value={endedOrders.toString()} />
      </div>

      <ManagerOrdersSection
        orders={orders}
        loading={loading}
        error={error}
        onRefresh={loadOrders}
      />
    </ManagerShell>
  );
}
