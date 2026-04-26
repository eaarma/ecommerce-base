package com.ecommercestore.backend.payment.stripe;

import java.math.BigDecimal;
import java.util.UUID;
import com.ecommercestore.backend.payment.PaymentStatus;

public record StripePaymentIntentResponse(
        UUID paymentId,
        Long orderId,
        String clientSecret,
        BigDecimal amount,
        String currency,
        PaymentStatus status) {
}