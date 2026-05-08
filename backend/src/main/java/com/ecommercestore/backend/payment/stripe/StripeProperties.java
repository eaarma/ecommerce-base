package com.ecommercestore.backend.payment.stripe;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Data;

@Component
@Data
@ConfigurationProperties(prefix = "stripe")
public class StripeProperties {

        private String apiKey;

        private String webhookSecret;

        private String accountId;

        private boolean enabled = true;

        private String apiVersion;
}
