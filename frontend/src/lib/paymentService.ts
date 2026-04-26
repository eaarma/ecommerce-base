import api from "@/lib/api/axios";
import type { PaymentResponseDto, RefundResponseDto } from "@/types/payment";

export const PaymentService = {
  getManagerPayments: async (): Promise<PaymentResponseDto[]> => {
    const res = await api.get("/api/manager/payments");
    return res.data;
  },

  getManagerOrderPayments: async (
    orderId: number,
  ): Promise<PaymentResponseDto[]> => {
    const res = await api.get(`/api/manager/orders/${orderId}/payments`);
    return res.data;
  },

  getManagerPaymentRefunds: async (
    paymentId: string,
  ): Promise<RefundResponseDto[]> => {
    const res = await api.get(`/api/manager/payments/${paymentId}/refunds`);
    return res.data;
  },
};
