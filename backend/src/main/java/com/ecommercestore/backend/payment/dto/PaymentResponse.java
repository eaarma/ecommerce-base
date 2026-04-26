package com.ecommercestore.backend.payment.dto;

import com.ecommercestore.backend.payment.PaymentProvider;
import com.ecommercestore.backend.payment.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        Long orderId,
        PaymentProvider provider,
        PaymentStatus status,
        String providerPaymentIntentId,
        String providerChargeId,
        BigDecimal amount,
        String currency,
        String failureCode,
        String failureMessage,
        Instant createdAt,
        Instant updatedAt,
        Instant paidAt) {
}
