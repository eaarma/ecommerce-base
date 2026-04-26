export type PaymentProvider = "STRIPE";

export type PaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface PaymentResponseDto {
  id: string;
  orderId: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  providerPaymentIntentId?: string | null;
  providerChargeId?: string | null;
  amount: number;
  currency: string;
  failureCode?: string | null;
  failureMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
}

export type RefundStatus = "PENDING" | "SUCCEEDED" | "FAILED";

export interface RefundResponseDto {
  id: string;
  paymentId: string;
  orderId: number;
  orderItemId?: number | null;
  amount: number;
  currency: string;
  reason?: string | null;
  quantity?: number | null;
  status: RefundStatus;
  stripeRefundId?: string | null;
  createdAt: string;
  succeededAt?: string | null;
}

export interface StripePaymentIntentResponse {
  paymentId: string;
  orderId: number;
  clientSecret?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
}
