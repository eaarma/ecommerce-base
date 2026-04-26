package com.ecommercestore.backend.delivery.dto;

import com.ecommercestore.backend.delivery.DeliveryCarrier;
import com.ecommercestore.backend.delivery.DeliveryMethod;
import com.ecommercestore.backend.delivery.DeliveryStatus;

import java.time.Instant;

public record DeliveryResponse(
        Long id,
        DeliveryMethod method,
        DeliveryStatus status,
        String recipientName,
        String recipientPhone,
        String recipientEmail,
        DeliveryCarrier carrier,
        String parcelLockerId,
        String parcelLockerName,
        String parcelLockerAddress,
        String addressLine1,
        String addressLine2,
        String city,
        String postalCode,
        String country,
        String trackingNumber,
        String trackingUrl,
        Instant shippedAt,
        Instant deliveredAt,
        Instant createdAt,
        Instant updatedAt
) {
}
