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

  deliveryAddressLine1: string;
  deliveryAddressLine2?: string | null;
  deliveryCity: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  deliveryPhone?: string | null;

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

  deliveryAddressLine1: string;
  deliveryAddressLine2?: string | null;
  deliveryCity: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  deliveryPhone?: string | null;

  items: ReserveOrderItemRequest[];
}

export type OrderResponse = Order;
