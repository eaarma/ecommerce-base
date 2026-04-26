"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

import Modal from "@/components/common/Modal";
import StripePaymentForm from "@/components/payment/StripePaymentForm";
import { OrderService } from "@/lib/orderService";
import { StripeService } from "@/lib/stripeService";
import StripeProvider from "@/providers/StripeProvider";
import { removeSelectedFromCart } from "@/store/cartSlice";
import type { OrderResponse } from "@/types/order";
import {
  formatDeliveryCarrier,
  formatDeliveryMethod,
  formatDeliveryStatus,
  getDeliveryDestinationLines,
} from "@/utils/delivery";
import type { StripePaymentIntentResponse } from "@/types/payment";

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

const formatStatus = (value: string) => value.replace(/_/g, " ").toLowerCase();

const formatCountdown = (value: number) =>
  `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, "0")}`;

const getOrderIdParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const orderId = Number(getOrderIdParam(params.orderId));
  const reservationToken = searchParams.get("token") ?? "";

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [paymentIntent, setPaymentIntent] =
    useState<StripePaymentIntentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isWaitingForWebhook, setIsWaitingForWebhook] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);

  const isPayable =
    order?.status === "RESERVED" ||
    order?.status === "FINALIZED" ||
    order?.status === "PAYMENT_FAILED";

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

        setOrder(data);

        if (data.expiresAt) {
          const seconds = Math.floor(
            (new Date(data.expiresAt).getTime() - Date.now()) / 1000,
          );
          setExpiresIn(Math.max(0, seconds));
        }

        if (
          data.status !== "RESERVED" &&
          data.status !== "FINALIZED" &&
          data.status !== "PAYMENT_FAILED" &&
          data.status !== "PAID"
        ) {
          toast.error("Order is not payable");
          router.replace("/cart");
        }
      } catch {
        if (cancelled) return;
        toast.error("Order not found");
        router.replace("/cart");
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

  useEffect(() => {
    if (!order?.expiresAt || order.status !== "RESERVED") return;

    const interval = window.setInterval(() => {
      setExpiresIn((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          toast.error("Reservation expired");
          router.replace("/cart");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [order?.expiresAt, order?.status, router]);

  useEffect(() => {
    if (order?.status !== "PAID") return;

    router.replace(
      `/confirmation/${order.id}?token=${encodeURIComponent(
        order.reservationToken,
      )}`,
    );
  }, [order, router]);

  const handleOpenPaymentModal = async () => {
    if (!order || !isPayable) return;

    if (paymentIntent) {
      setIsPaymentModalOpen(true);
      return;
    }

    try {
      setIsPreparingPayment(true);
      const intent = await StripeService.createIntent(
        order.id,
        order.reservationToken,
      );

      if (intent.status === "SUCCEEDED" || !intent.clientSecret) {
        const paidOrder = await waitForPaidOrder();

        if (paidOrder) {
          completePaidOrder(paidOrder);
        }

        return;
      }

      setPaymentIntent(intent);
      setOrder((current) =>
        current &&
        (current.status === "RESERVED" || current.status === "PAYMENT_FAILED")
          ? {
              ...current,
              status: "FINALIZED",
              finalizedAt: new Date().toISOString(),
            }
          : current,
      );
      setIsPaymentModalOpen(true);
    } catch {
      toast.error("Failed to prepare payment");
    } finally {
      setIsPreparingPayment(false);
    }
  };

  const waitForPaidOrder = async () => {
    if (!order) return;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const latestOrder = await OrderService.getOrder(
        order.id,
        order.reservationToken,
      );

      setOrder(latestOrder);

      if (latestOrder.status === "PAID") {
        return latestOrder;
      }

      if (latestOrder.status === "PAYMENT_FAILED") {
        throw new Error("Payment failed");
      }

      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }

    throw new Error("Payment confirmation is still pending");
  };

  const completePaidOrder = (paidOrder: OrderResponse) => {
    setIsPaymentModalOpen(false);
    dispatch(removeSelectedFromCart());
    toast.success("Payment successful");
    router.push(
      `/confirmation/${paidOrder.id}?token=${encodeURIComponent(
        paidOrder.reservationToken,
      )}`,
    );
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setIsWaitingForWebhook(true);
      await StripeService.confirmIntent(
        orderId,
        reservationToken,
        paymentIntentId,
      );

      const paidOrder = await waitForPaidOrder();

      if (!paidOrder) return;

      completePaidOrder(paidOrder);
    } catch (error) {
      setPaymentIntent(null);
      setIsPaymentModalOpen(false);
      const message =
        error instanceof Error && error.message === "Payment failed"
          ? "Payment failed. Please try again."
          : "Payment succeeded, but webhook confirmation is still pending.";

      toast.error(message);
    } finally {
      setIsWaitingForWebhook(false);
    }
  };

  const handlePaymentError = (message: string) => {
    setPaymentIntent(null);
    setIsPaymentModalOpen(false);
    toast.error(message);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[28px] border border-base-300 bg-base-100 px-6 py-16 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="mt-5 text-lg font-semibold text-base-content">
              Loading payment details
            </p>
            <p className="mt-2 text-sm text-base-content/60">
              We’re preparing your order summary.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!order) return null;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[28px] border border-base-300 bg-base-100 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-base-300 bg-[linear-gradient(135deg,rgba(224,242,254,0.95)_0%,rgba(249,250,251,0.98)_55%,rgba(236,253,245,0.95)_100%)] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
                  Payment
                </p>
                <h1 className="mt-3 text-3xl font-bold text-base-content">
                  Review and Pay
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-base-content/65">
                  One last review before payment. Confirm the order details,
                  delivery information, and amount before opening Stripe.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="badge badge-outline border-base-300 bg-base-100/80 px-4 py-3 capitalize text-base-content">
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
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-content">
                    1
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">
                      Review Details
                    </h2>
                    <p className="text-sm text-base-content/60">
                      Check who is paying and where the order will be sent.
                    </p>
                  </div>
                </div>

                {order.status === "PAYMENT_FAILED" && (
                  <div className="rounded-2xl border border-error/20 bg-error/5 p-4 text-sm leading-6 text-base-content/75">
                    A previous payment attempt failed. Your order details are
                    still saved here, so you can review everything and try
                    again.
                  </div>
                )}

                {order.status === "RESERVED" && order.expiresAt && (
                  <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm leading-6 text-base-content/75">
                    Your reservation is still being held. Complete payment
                    before the timer runs out to keep the order active.
                  </div>
                )}

                <div className="space-y-4">
                  <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/65">
                      Purchaser
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
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-content">
                    2
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">
                      Order Summary
                    </h2>
                    <p className="text-sm text-base-content/60">
                      Review the items included in this payment.
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
              <section className="space-y-6 rounded-[24px] border border-base-300 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(240,249,255,0.88)_100%)] p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-content">
                    3
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">
                      Pay Securely
                    </h2>
                    <p className="text-sm text-base-content/60">
                      Open Stripe to complete the payment.
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

                {order.status === "RESERVED" && order.expiresAt && (
                  <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/55">
                      Reservation Hold
                    </p>
                    <p className="mt-2 text-2xl font-bold text-base-content">
                      {formatCountdown(expiresIn)}
                    </p>
                    <p className="mt-1 text-sm text-base-content/65">
                      Time remaining to complete payment.
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-primary/15 bg-base-100 p-4 text-sm leading-6 text-base-content/70">
                  Your payment is processed securely by Stripe. We’ll confirm
                  the order automatically as soon as the payment succeeds.
                </div>

                {order.status === "PAID" ? (
                  <button
                    type="button"
                    className="btn btn-success h-12 w-full text-base"
                    disabled
                  >
                    Paid
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary h-12 w-full text-base"
                    disabled={isPreparingPayment || !isPayable}
                    onClick={handleOpenPaymentModal}
                  >
                    {isPreparingPayment
                      ? "Preparing payment..."
                      : order.status === "PAYMENT_FAILED"
                        ? "Retry Payment"
                        : "Continue to Secure Payment"}
                  </button>
                )}
              </section>
            </aside>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPaymentModalOpen && paymentIntent !== null}
        onClose={() => setIsPaymentModalOpen(false)}
        dismissable={!isWaitingForWebhook}
      >
        {isWaitingForWebhook ? (
          <div className="py-8 text-center">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="mt-4 text-xl font-semibold text-base-content">
              Confirming payment
            </p>
            <p className="mt-2 text-sm leading-6 text-base-content/60">
              Stripe has received your payment. We’re waiting for the final
              confirmation from the backend.
            </p>
          </div>
        ) : paymentIntent?.clientSecret ? (
          <StripeProvider clientSecret={paymentIntent.clientSecret}>
            <StripePaymentForm
              clientSecret={paymentIntent.clientSecret}
              amount={paymentIntent.amount}
              currency={paymentIntent.currency}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </StripeProvider>
        ) : null}
      </Modal>
    </main>
  );
}
