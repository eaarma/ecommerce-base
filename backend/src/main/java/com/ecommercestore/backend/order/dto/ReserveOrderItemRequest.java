package com.ecommercestore.backend.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ReserveOrderItemRequest(
        @NotNull Long productId,
        @NotNull @Min(1) Integer quantity
) {
}
