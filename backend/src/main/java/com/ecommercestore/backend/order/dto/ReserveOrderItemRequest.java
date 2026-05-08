package com.ecommercestore.backend.order.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ReserveOrderItemRequest(
        @NotNull @Positive Long productId,
        @NotNull @Positive Long variantId,
        @NotNull @Min(1) Integer quantity,
        @Positive BigDecimal expectedUnitPrice
) {
}
