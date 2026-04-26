package com.ecommercestore.backend.payment.refund.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record RefundRequest(
        @Positive Integer quantity,
        @NotBlank String reason) {
}
