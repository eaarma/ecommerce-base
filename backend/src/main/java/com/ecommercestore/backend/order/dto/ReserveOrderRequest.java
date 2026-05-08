package com.ecommercestore.backend.order.dto;

import com.ecommercestore.backend.delivery.dto.ReserveDeliveryRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ReserveOrderRequest(
        @NotBlank @Email @Size(max = 320) String customerEmail,
        @NotBlank @Size(max = 120) String customerFirstName,
        @NotBlank @Size(max = 120) String customerLastName,
        @NotNull @Valid ReserveDeliveryRequest delivery,
        @NotEmpty @Valid List<ReserveOrderItemRequest> items
) {
}
