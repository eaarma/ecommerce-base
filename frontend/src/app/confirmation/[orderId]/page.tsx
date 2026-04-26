"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import { OrderService } from "@/lib/orderService";
import type { OrderResponse } from "@/types/order";

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

const getOrderIdParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = Number(getOrderIdParam(params.orderId));
  const reservationToken = searchParams.get("token") ?? "";

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const contactName = useMemo(() => {
    if (!order) return "";
    return `${order.customerFirstName} ${order.customerLastName}`.trim();
  }, [order]);

  useEffect(() => {
    if (!Number.isFinite(orderId) || !reservationToken) {
      toast.error("Missing order details");
      router.replace("/cart");
      return;
    }

    let cancelled = false;

    const loadOrder = async () => {
      try {
        const data = await OrderService.getOrder(orderId, reservationToken);

        if (cancelled) return;

        if (data.status !== "PAID") {
          router.replace(
            `/payment/${data.id}?token=${encodeURIComponent(
              data.reservationToken,
            )}`,
          );
          return;
        }

        setOrder(data);
      } catch {
        if (!cancelled) {
          toast.error("Order not found");
          router.replace("/cart");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, reservationToken, router]);

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl p-4 pt-8">
        <span className="loading loading-spinner loading-lg" />
      </main>
    );
  }

  if (!order) return null;

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-4 pt-8">
      <section className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-success">
              Payment confirmed
            </p>
            <h1 className="mt-1 text-3xl font-bold text-base-content">
              Thank you for your purchase
            </h1>
            <p className="mt-2 text-base-content/60">Order #{order.id}</p>
          </div>
          <span className="badge badge-success">{order.status}</span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-base-200 p-4 text-sm">
            <h2 className="font-semibold text-base-content">Customer</h2>
            <p className="mt-2 text-base-content/70">{contactName}</p>
            <p className="text-base-content/70">{order.customerEmail}</p>
            {order.deliveryPhone && (
              <p className="text-base-content/70">{order.deliveryPhone}</p>
            )}
          </div>

          <div className="rounded-lg bg-base-200 p-4 text-sm">
            <h2 className="font-semibold text-base-content">Delivery</h2>
            <p className="mt-2 text-base-content/70">
              {order.deliveryAddressLine1}
              {order.deliveryAddressLine2
                ? `, ${order.deliveryAddressLine2}`
                : ""}
            </p>
            <p className="text-base-content/70">
              {order.deliveryCity}, {order.deliveryPostalCode}
            </p>
            <p className="text-base-content/70">{order.deliveryCountry}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-base-content">
            Purchased Items
          </h2>

          <ul className="mt-4 divide-y divide-base-300">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-base-content">
                    {item.productSnapshotName}
                  </p>
                  <p className="text-sm text-base-content/60">
                    {item.quantity} x{" "}
                    {formatMoney(item.unitPrice, order.currency)}
                  </p>
                </div>
                <p className="font-semibold text-base-content">
                  {formatMoney(item.lineTotal, order.currency)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 space-y-3 border-t border-base-300 pt-4">
          <div className="flex justify-between text-sm text-base-content/70">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal, order.currency)}</span>
          </div>
          <div className="flex justify-between text-sm text-base-content/70">
            <span>Shipping</span>
            <span>{formatMoney(order.shippingTotal, order.currency)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-base-content">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn btn-outline">
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
