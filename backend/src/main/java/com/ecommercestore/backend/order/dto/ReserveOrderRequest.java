package com.ecommercestore.backend.order.dto;

import com.ecommercestore.backend.delivery.dto.ReserveDeliveryRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ReserveOrderRequest(
        @NotBlank @Email String customerEmail,
        @NotBlank String customerFirstName,
        @NotBlank String customerLastName,
        @NotNull @Valid ReserveDeliveryRequest delivery,
        @NotEmpty @Valid List<ReserveOrderItemRequest> items
) {
}
