package com.ecommercestore.backend.order;

public enum OrderItemStatus {
    RESERVED,
    ORDERED,
    CANCELLED,
    CANCELLED_NO_REFUND,
    EXPIRED,
    REFUNDED,
    PARTIALLY_REFUNDED,
    RETURN_REQUESTED,
    RETURNED,
    DAMAGED
}
