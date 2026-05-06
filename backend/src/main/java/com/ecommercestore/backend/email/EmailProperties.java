package com.ecommercestore.backend.email;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.Data;

@Component
@Data
@ConfigurationProperties(prefix = "app.email")
public class EmailProperties {

    private String enabled;
    private String from;
    private String contactReceiver;
    private String storeName = "Ecommerce Store";

    public boolean isEnabled() {
        if (StringUtils.hasText(enabled)) {
            return Boolean.parseBoolean(enabled.trim());
        }

        return StringUtils.hasText(from);
    }
}
