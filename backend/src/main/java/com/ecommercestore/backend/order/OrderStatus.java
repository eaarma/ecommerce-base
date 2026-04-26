package com.ecommercestore.backend.order;

public enum OrderStatus {
    RESERVED,
    FINALIZED,
    PAID,
    PAYMENT_FAILED,
    CANCELLED,
    PARTIALLY_REFUNDED,
    REFUNDED,
    CANCELLED_REFUNDED,
    EXPIRED
}
