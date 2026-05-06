"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ManagerPaymentsSection from "@/components/manager/payments/ManagerPaymentsSection";
import ManagerShell from "@/components/manager/layout/ManagerShell";
import ManagerStatCard from "@/components/manager/shared/ManagerStatCard";
import { PaymentService } from "@/lib/paymentService";
import type { PaymentResponseDto } from "@/types/payment";

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

export default function ManagerPaymentsPage() {
  const [payments, setPayments] = useState<PaymentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await PaymentService.getManagerPayments();
      setPayments(data);
    } catch {
      setError("Could not load payments. Please sign in with a staff account.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    PaymentService.getManagerPayments()
      .then((data) => {
        if (!cancelled) {
          setPayments(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Could not load payments. Please sign in with a staff account.",
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

  const succeededPayments = useMemo(
    () => payments.filter((payment) => payment.status === "SUCCEEDED"),
    [payments],
  );
  const failedPayments = useMemo(
    () => payments.filter((payment) => payment.status === "FAILED").length,
    [payments],
  );
  const pendingPayments = useMemo(
    () => payments.filter((payment) => payment.status === "PENDING").length,
    [payments],
  );
  const paidCurrency = succeededPayments[0]?.currency ?? "EUR";
  const totalPaidAmount = succeededPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  return (
    <ManagerShell
      title="Payments"
      description="Stripe payment attempts, outcomes, and payment references."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagerStatCard
          label="Succeeded Payments"
          value={succeededPayments.length.toString()}
        />
        <ManagerStatCard label="Failed Payments" value={failedPayments.toString()} />
        <ManagerStatCard
          label="Pending Payments"
          value={pendingPayments.toString()}
        />
        <ManagerStatCard
          label="Total Paid Amount"
          value={formatMoney(totalPaidAmount, paidCurrency)}
        />
      </div>

      <ManagerPaymentsSection
        payments={payments}
        loading={loading}
        error={error}
        onRefresh={loadPayments}
      />
    </ManagerShell>
  );
}
