package com.ecommercestore.backend.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ReserveOrderRequest(
        @NotBlank @Email String customerEmail,
        @NotBlank String customerFirstName,
        @NotBlank String customerLastName,
        @NotBlank String deliveryAddressLine1,
        String deliveryAddressLine2,
        @NotBlank String deliveryCity,
        @NotBlank String deliveryPostalCode,
        @NotBlank String deliveryCountry,
        String deliveryPhone,
        @NotEmpty @Valid List<ReserveOrderItemRequest> items
) {
}
