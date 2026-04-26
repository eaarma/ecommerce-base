"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import { OrderService } from "@/lib/orderService";
import type { OrderResponse } from "@/types/order";
import {
  formatDeliveryCarrier,
  formatDeliveryMethod,
  formatDeliveryStatus,
  getDeliveryDestinationLines,
} from "@/utils/delivery";

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

const formatStatus = (value: string) => value.replace(/_/g, " ").toLowerCase();

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

  const deliveryLines = useMemo(
    () => (order ? getDeliveryDestinationLines(order.delivery) : []),
    [order],
  );

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
      <main className="min-h-screen bg-[linear-gradient(180deg,rgba(167,243,208,0.18)_0%,rgba(249,250,251,1)_30%,rgba(249,250,251,1)_100%)] px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[28px] border border-base-300 bg-base-100 px-6 py-16 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8">
            <span className="loading loading-spinner loading-lg text-success" />
            <p className="mt-5 text-lg font-semibold text-base-content">
              Loading confirmation
            </p>
            <p className="mt-2 text-sm text-base-content/60">
              We&apos;re getting your completed order ready.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!order) return null;

  return (
    <main className="min-h-screen  px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[28px] border border-base-300 bg-base-100 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-base-300 bg-[linear-gradient(135deg,rgba(220,252,231,0.96)_0%,rgba(249,250,251,0.98)_50%,rgba(224,242,254,0.95)_100%)] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-success/80">
                  Confirmation
                </p>
                <h1 className="mt-3 text-3xl font-bold text-base-content">
                  Payment Confirmed
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-base-content/65">
                  Your order is in. We&apos;ve saved the delivery details and
                  your order is now ready for fulfillment.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="badge border-success/20 bg-success/10 px-4 py-3 font-medium capitalize text-success">
                  {formatStatus(order.status)}
                </span>
                <span className="badge badge-outline border-base-300 bg-base-100/80 px-4 py-3 text-base-content">
                  Order #{order.id}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success text-sm font-semibold text-success-content">
                    1
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">
                      Order Complete
                    </h2>
                    <p className="text-sm text-base-content/60">
                      Here&apos;s the final record of who ordered and where
                      it&apos;s going.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-success/20 bg-success/5 p-5 text-sm leading-6 text-base-content/75">
                  Thank you for your purchase. Your payment has been accepted
                  and your order is now queued for delivery processing.
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/65">
                      Customer
                    </p>
                    <p className="mt-3 text-lg font-semibold text-base-content">
                      {contactName}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-base-content/70">
                      {order.customerEmail}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary/70">
                          Delivery
                        </p>
                        <p className="mt-3 text-lg font-semibold text-base-content">
                          {order.delivery.recipientName}
                        </p>
                      </div>

                      <span className="badge badge-outline border-base-300 bg-base-100 capitalize text-base-content">
                        {formatDeliveryStatus(order.delivery.status)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm leading-6 text-base-content/70">
                      <p>{order.delivery.recipientEmail}</p>
                      {order.delivery.recipientPhone && (
                        <p>{order.delivery.recipientPhone}</p>
                      )}
                      <p className="pt-2">
                        {formatDeliveryMethod(order.delivery.method)} via{" "}
                        {formatDeliveryCarrier(order.delivery.carrier)}
                      </p>
                      {deliveryLines.map((line, index) => (
                        <p key={`${line}-${index}`}>{line}</p>
                      ))}
                      {order.delivery.trackingNumber && (
                        <p className="pt-2">
                          Tracking number: {order.delivery.trackingNumber}
                        </p>
                      )}
                      {order.delivery.trackingUrl && (
                        <a
                          href={order.delivery.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-sm font-medium text-primary hover:underline"
                        >
                          Track shipment
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-content">
                    2
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">
                      Purchased Items
                    </h2>
                    <p className="text-sm text-base-content/60">
                      A final summary of the products included in this order.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
                  <ul className="divide-y divide-base-300">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-4 px-5 py-4"
                      >
                        <div>
                          <p className="font-medium text-base-content">
                            {item.productSnapshotName}
                          </p>
                          <p className="mt-1 text-sm text-base-content/60">
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
              </section>
            </div>

            <aside className="h-fit lg:sticky lg:top-8">
              <section className="space-y-6 rounded-[24px] border border-base-300 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(240,253,244,0.88)_100%)] p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-content">
                    3
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">
                      Next Steps
                    </h2>
                    <p className="text-sm text-base-content/60">
                      Everything is paid. Here&apos;s what happens now.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
                  <div className="space-y-3 text-sm text-base-content/70">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatMoney(order.subtotal, order.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>
                        {formatMoney(order.shippingTotal, order.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-base-300 pt-3 text-lg font-semibold text-base-content">
                      <span>Total</span>
                      <span>{formatMoney(order.total, order.currency)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/15 bg-base-100 p-4 text-sm leading-6 text-base-content/70">
                  The order is paid and the delivery status is currently{" "}
                  <span className="font-semibold text-base-content">
                    {formatDeliveryStatus(order.delivery.status).toLowerCase()}
                  </span>
                  . Confirmation email has been sent.
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/"
                    className="btn btn-primary h-12 w-full text-base"
                  >
                    Back to Home
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
