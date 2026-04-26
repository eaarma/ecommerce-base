import api from "./api/axios";
import {
  OrderResponse,
  OrderStatus,
  ReserveOrderRequest,
  UpdateDeliveryRequest,
} from "@/types/order";
import type { RefundResponseDto } from "@/types/payment";

export const OrderService = {
  reserveOrder: async (data: ReserveOrderRequest): Promise<OrderResponse> => {
    const res = await api.post("/api/checkout/orders/reserve", data);
    return res.data;
  },

  finalizeOrder: async (
    orderId: number,
    reservationToken: string,
  ): Promise<OrderResponse> => {
    const res = await api.post(
      `/api/checkout/orders/${orderId}/finalize`,
      null,
      { params: { token: reservationToken } },
    );

    return res.data;
  },

  payPlaceholder: async (
    orderId: number,
    reservationToken: string,
  ): Promise<OrderResponse> => {
    const res = await api.post(
      `/api/checkout/orders/${orderId}/pay-placeholder`,
      null,
      { params: { token: reservationToken } },
    );

    return res.data;
  },

  cancelReservation: async (
    orderId: number,
    reservationToken: string,
  ): Promise<OrderResponse> => {
    const res = await api.post(
      `/api/checkout/orders/${orderId}/cancel`,
      null,
      { params: { token: reservationToken } },
    );

    return res.data;
  },

  getOrder: async (
    orderId: number,
    reservationToken: string,
  ): Promise<OrderResponse> => {
    const res = await api.get(`/api/checkout/orders/${orderId}`, {
      params: { token: reservationToken },
    });

    return res.data;
  },

  getManagerOrders: async (status?: OrderStatus): Promise<OrderResponse[]> => {
    const res = await api.get("/api/manager/orders", {
      params: status ? { status } : undefined,
    });

    return res.data;
  },

  getManagerOrder: async (orderId: number): Promise<OrderResponse> => {
    const res = await api.get(`/api/manager/orders/${orderId}`);
    return res.data;
  },

  updateManagerDelivery: async (
    orderId: number,
    data: UpdateDeliveryRequest,
  ): Promise<OrderResponse> => {
    const res = await api.patch(`/api/manager/orders/${orderId}/delivery`, data);
    return res.data;
  },

  refundManagerOrder: async (
    orderId: number,
    reason: string,
  ): Promise<RefundResponseDto> => {
    const res = await api.post(`/api/manager/orders/${orderId}/refunds/full`, {
      reason,
    });
    return res.data;
  },

  refundManagerOrderItem: async (
    orderId: number,
    orderItemId: number,
    quantity: number,
    reason: string,
  ): Promise<RefundResponseDto> => {
    const res = await api.post(
      `/api/manager/orders/${orderId}/items/${orderItemId}/refund`,
      { quantity, reason },
    );
    return res.data;
  },

  getManagerOrderRefunds: async (
    orderId: number,
  ): Promise<RefundResponseDto[]> => {
    const res = await api.get(`/api/manager/orders/${orderId}/refunds`);
    return res.data;
  },

  reserve: (data: ReserveOrderRequest) => OrderService.reserveOrder(data),
  finalize: (orderId: number, reservationToken: string) =>
    OrderService.finalizeOrder(orderId, reservationToken),
  getStatus: (orderId: number, reservationToken: string) =>
    OrderService.getOrder(orderId, reservationToken),
};
