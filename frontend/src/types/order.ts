export type OrderStatus =
  | "RESERVED"
  | "FINALIZED"
  | "PAID"
  | "PAYMENT_FAILED"
  | "CANCELLED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "CANCELLED_REFUNDED"
  | "EXPIRED";

export type OrderItemStatus =
  | "RESERVED"
  | "ORDERED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "DAMAGED";

export type DeliveryMethod = "PARCEL_LOCKER" | "POSTAL_DELIVERY";

export type DeliveryStatus =
  | "NOT_READY"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type DeliveryCarrier = "DPD" | "OMNIVA" | "ITELLA" | "OTHER";

export interface Delivery {
  id: number;
  method: DeliveryMethod;
  status: DeliveryStatus;
  recipientName: string;
  recipientPhone?: string | null;
  recipientEmail: string;
  carrier: DeliveryCarrier;
  parcelLockerId?: string | null;
  parcelLockerName?: string | null;
  parcelLockerAddress?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  productSnapshotId: number;
  productSnapshotName: string;
  productSnapshotImageUrl?: string | null;

  unitPrice: number;
  quantity: number;
  lineTotal: number;

  status: OrderItemStatus;
}

export interface Order {
  id: number;
  reservationToken: string;

  status: OrderStatus;

  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;

  delivery: Delivery;

  subtotal: number;
  shippingTotal: number;
  total: number;
  currency: string;

  expiresAt?: string | null;
  finalizedAt?: string | null;
  paidAt?: string | null;

  createdAt: string;
  updatedAt: string;

  items: OrderItem[];
}

export interface ReserveOrderItemRequest {
  productId: number;
  quantity: number;
}

export interface ReserveOrderRequest {
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;

  delivery: ReserveDeliveryRequest;

  items: ReserveOrderItemRequest[];
}

export interface ReserveDeliveryRequest {
  method: DeliveryMethod;
  carrier: DeliveryCarrier;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  parcelLockerId?: string | null;
  parcelLockerName?: string | null;
  parcelLockerAddress?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface UpdateDeliveryRequest {
  status?: DeliveryStatus;
  carrier?: DeliveryCarrier;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

export type OrderResponse = Order;
