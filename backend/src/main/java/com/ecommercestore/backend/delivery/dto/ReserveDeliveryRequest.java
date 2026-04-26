package com.ecommercestore.backend.delivery.dto;

import com.ecommercestore.backend.delivery.DeliveryCarrier;
import com.ecommercestore.backend.delivery.DeliveryMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReserveDeliveryRequest(
        @NotNull DeliveryMethod method,
        @NotNull DeliveryCarrier carrier,
        @NotBlank String recipientName,
        @NotBlank String recipientPhone,
        @NotBlank @Email String recipientEmail,
        String parcelLockerId,
        String parcelLockerName,
        String parcelLockerAddress,
        String addressLine1,
        String addressLine2,
        String city,
        String postalCode,
        String country
) {
}
