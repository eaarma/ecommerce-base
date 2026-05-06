package com.ecommercestore.backend.email;

import java.util.UUID;

public record OrderEmailRequestedEvent(
        Long orderId,
        OrderEmailType type,
        String cancellationReason,
        UUID refundId) {
}
