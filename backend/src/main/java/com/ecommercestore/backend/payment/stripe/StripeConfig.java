package com.ecommercestore.backend.payment.stripe;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
@RequiredArgsConstructor
public class StripeConfig {

    private static final Logger logger = LoggerFactory.getLogger(StripeConfig.class);

    private final StripeProperties stripeProperties;

    @PostConstruct
    public void init() {

        if (!stripeProperties.isEnabled()) {
            logger.warn("Stripe integration is disabled");
            return;
        }

        String apiKey = stripeProperties.getApiKey();
        String webhookSecret = stripeProperties.getWebhookSecret();

        if (!StringUtils.hasText(apiKey) || !StringUtils.hasText(webhookSecret)) {
            throw new IllegalStateException(
                    "Stripe API key and webhook secret must be configured when Stripe is enabled");
        }

        Stripe.apiKey = apiKey;

        logger.info("Stripe API initialized successfully");
    }

    public StripeProperties getProperties() {
        return stripeProperties;
    }
}
