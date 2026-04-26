package com.ecommercestore.backend.payment.stripe;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

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

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Stripe API key is not configured");
        }

        Stripe.apiKey = apiKey;

        logger.info("Stripe API initialized successfully");
    }

    public StripeProperties getProperties() {
        return stripeProperties;
    }
}
