package com.ecommercestore.backend.payment.refund.dto;

import com.ecommercestore.backend.payment.refund.RefundStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RefundResponse(
        UUID id,
        UUID paymentId,
        Long orderId,
        Long orderItemId,
        BigDecimal amount,
        String currency,
        String reason,
        Integer quantity,
        RefundStatus status,
        String stripeRefundId,
        Instant createdAt,
        Instant succeededAt) {
}
