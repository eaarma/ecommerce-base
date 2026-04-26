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
import type { StripePaymentIntentResponse } from "@/types/payment";

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

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
      <main className="mx-auto min-h-screen max-w-4xl p-4 pt-8">
        <span className="loading loading-spinner loading-lg" />
      </main>
    );
  }

  if (!order) return null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 pt-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-base-content">Payment</h1>
              <p className="text-sm text-base-content/60">Order #{order.id}</p>
            </div>
            <span className="badge badge-outline">{order.status}</span>
          </div>

          <div className="mt-6 rounded-lg bg-base-200 p-4 text-sm">
            <p className="font-semibold text-base-content">{contactName}</p>
            <p className="text-base-content/70">{order.customerEmail}</p>
            {order.deliveryPhone && (
              <p className="text-base-content/70">{order.deliveryPhone}</p>
            )}
            <p className="mt-2 text-base-content/70">
              {order.deliveryAddressLine1}
              {order.deliveryAddressLine2
                ? `, ${order.deliveryAddressLine2}`
                : ""}
              , {order.deliveryCity}, {order.deliveryPostalCode},{" "}
              {order.deliveryCountry}
            </p>
          </div>

          <ul className="mt-6 divide-y divide-base-300">
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
        </section>

        <aside className="h-fit rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-base-content">
            Order Total
          </h2>

          <div className="mt-5 space-y-3 text-sm text-base-content/70">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{formatMoney(order.shippingTotal, order.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-base-300 pt-3 text-lg font-semibold text-base-content">
              <span>Total</span>
              <span>{formatMoney(order.total, order.currency)}</span>
            </div>
          </div>

          {order.status === "RESERVED" && order.expiresAt && (
            <div className="mt-5 rounded-lg bg-warning/20 p-3 text-center text-sm font-semibold">
              Reservation expires in {Math.floor(expiresIn / 60)}:
              {(expiresIn % 60).toString().padStart(2, "0")}
            </div>
          )}

          <div className="mt-6">
            {order.status === "PAID" ? (
              <button type="button" className="btn btn-success w-full" disabled>
                Paid
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary w-full"
                disabled={isPreparingPayment || !isPayable}
                onClick={handleOpenPaymentModal}
              >
                {isPreparingPayment
                  ? "Preparing payment..."
                  : order.status === "PAYMENT_FAILED"
                    ? "Retry Payment"
                    : "Pay"}
              </button>
            )}
          </div>
        </aside>
      </div>

      <Modal
        isOpen={isPaymentModalOpen && paymentIntent !== null}
        onClose={() => setIsPaymentModalOpen(false)}
        dismissable={!isWaitingForWebhook}
      >
        {isWaitingForWebhook ? (
          <div className="py-8 text-center">
            <span className="loading loading-spinner loading-lg" />
            <p className="mt-4 font-semibold text-base-content">
              Confirming payment
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
