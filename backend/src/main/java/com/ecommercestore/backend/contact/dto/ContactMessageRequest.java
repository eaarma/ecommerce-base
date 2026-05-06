package com.ecommercestore.backend.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactMessageRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 255) String email,
        @Size(max = 160) String subject,
        @NotBlank @Size(max = 5000) String message) {
}
