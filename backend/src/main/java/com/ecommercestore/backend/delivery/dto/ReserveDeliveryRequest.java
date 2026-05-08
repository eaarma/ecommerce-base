package com.ecommercestore.backend.delivery.dto;

import com.ecommercestore.backend.delivery.DeliveryCarrier;
import com.ecommercestore.backend.delivery.DeliveryMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReserveDeliveryRequest(
        @NotNull DeliveryMethod method,
        @NotNull DeliveryCarrier carrier,
        @NotBlank @Size(max = 120) String recipientName,
        @NotBlank @Size(max = 40) String recipientPhone,
        @NotBlank @Email @Size(max = 255) String recipientEmail,
        @Size(max = 255) String parcelLockerId,
        @Size(max = 255) String parcelLockerName,
        @Size(max = 500) String parcelLockerAddress,
        @Size(max = 255) String addressLine1,
        @Size(max = 255) String addressLine2,
        @Size(max = 255) String city,
        @Size(max = 100) String postalCode,
        @Size(max = 255) String country
) {
}
