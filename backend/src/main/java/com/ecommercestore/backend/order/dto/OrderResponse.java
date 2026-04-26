package com.ecommercestore.backend.order.dto;

import com.ecommercestore.backend.order.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        Long id,
        UUID reservationToken,
        OrderStatus status,
        String customerEmail,
        String customerFirstName,
        String customerLastName,
        String deliveryAddressLine1,
        String deliveryAddressLine2,
        String deliveryCity,
        String deliveryPostalCode,
        String deliveryCountry,
        String deliveryPhone,
        BigDecimal subtotal,
        BigDecimal shippingTotal,
        BigDecimal total,
        String currency,
        Instant expiresAt,
        Instant finalizedAt,
        Instant paidAt,
        Instant createdAt,
        Instant updatedAt,
        List<OrderItemResponse> items
) {
}
