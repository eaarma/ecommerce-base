import { StripePaymentIntentResponse } from "@/types/payment";
import api from "./api/axios";

export const StripeService = {
  createIntent: async (
    orderId: number,
    reservationToken: string,
  ): Promise<StripePaymentIntentResponse> => {
    const res = await api.post(
      `/api/orders/${orderId}/payments/stripe/intent`,
      null,
      { params: { token: reservationToken } },
    );

    return res.data;
  },

  startPayment: async (
    orderId: number,
    reservationToken: string,
  ): Promise<void> => {
    await api.post(`/api/orders/${orderId}/payments/stripe/start`, null, {
      params: { token: reservationToken },
    });
  },

  confirmIntent: async (
    orderId: number,
    reservationToken: string,
    paymentIntentId: string,
  ): Promise<StripePaymentIntentResponse> => {
    const res = await api.post(
      `/api/orders/${orderId}/payments/stripe/confirm`,
      null,
      { params: { token: reservationToken, paymentIntentId } },
    );

    return res.data;
  },
};
