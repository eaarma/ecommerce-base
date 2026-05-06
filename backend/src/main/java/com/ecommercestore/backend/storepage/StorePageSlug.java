package com.ecommercestore.backend.storepage;

import java.util.Arrays;
import java.util.Locale;

public enum StorePageSlug {
    ABOUT("about"),
    CONTACT("contact"),
    FAQ("faq"),
    PRIVACY("privacy"),
    TERMS("terms"),
    CANCELLATION_REFUND("cancellation-refund"),
    SHIPPING("shipping");

    private final String value;

    StorePageSlug(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static StorePageSlug fromValue(String value) {
        String normalizedValue = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(slug -> slug.value.equals(normalizedValue))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unsupported store page slug. Allowed slugs: "
                                + Arrays.stream(values())
                                        .map(StorePageSlug::getValue)
                                        .reduce((left, right) -> left + ", " + right)
                                        .orElse("")));
    }
}
