package com.ecommercestore.backend.payment.stripe;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Component
@Data
@Validated
@ConfigurationProperties(prefix = "stripe")
public class StripeProperties {

        @NotBlank
        private String apiKey;

        @NotBlank
        private String webhookSecret;

        private String accountId;

        private boolean enabled = true;

        private String apiVersion;
}
