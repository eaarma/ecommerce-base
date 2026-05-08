package com.ecommercestore.backend.payment.refund.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record RefundRequest(
        @Positive Integer quantity,
        @NotBlank @Size(max = 500) String reason) {
}
