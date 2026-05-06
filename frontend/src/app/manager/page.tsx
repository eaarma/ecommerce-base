"use client";

import { useEffect, useState } from "react";

import DashboardSection from "@/components/manager/dashboard/DashboardSection";
import ManagerShell from "@/components/manager/layout/ManagerShell";
import { ManagerProductService } from "@/lib/managerProductService";
import { OrderService } from "@/lib/orderService";
import { PaymentService } from "@/lib/paymentService";
import type { OrderResponse } from "@/types/order";
import type { PaymentResponseDto } from "@/types/payment";
import type { ProductDto } from "@/types/product";

export default function ManagerDashboardPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [payments, setPayments] = useState<PaymentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      ManagerProductService.getAllProducts(),
      OrderService.getManagerOrders(),
      PaymentService.getManagerPayments(),
    ])
      .then(([productsData, ordersData, paymentsData]) => {
        if (cancelled) return;

        setProducts(productsData);
        setOrders(ordersData);
        setPayments(paymentsData);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Could not load dashboard. Please sign in with a staff account.",
          );
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

  return (
    <ManagerShell
      title="Dashboard"
      description="A global overview of store activity and payment health."
    >
      <DashboardSection
        products={products}
        orders={orders}
        payments={payments}
        loading={loading}
        error={error}
      />
    </ManagerShell>
  );
}
