package com.ecommercestore.backend.payment;

public enum PaymentStatus {
    PENDING,
    SUCCEEDED,
    SUCCEEDED_REQUIRES_REVIEW,
    FAILED,
    PARTIALLY_REFUNDED,
    REFUNDED
}
