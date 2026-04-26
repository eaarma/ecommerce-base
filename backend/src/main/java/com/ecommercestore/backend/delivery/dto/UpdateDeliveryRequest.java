package com.ecommercestore.backend.delivery.dto;

import com.ecommercestore.backend.delivery.DeliveryCarrier;
import com.ecommercestore.backend.delivery.DeliveryStatus;

public record UpdateDeliveryRequest(
        DeliveryStatus status,
        DeliveryCarrier carrier,
        String trackingNumber,
        String trackingUrl
) {
}
