package com.ecommercestore.backend.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImageRequest {

    @Positive
    private Long id;

    @Positive
    private Long variantId;

    @NotBlank
    @Size(max = 500)
    private String imageUrl;

    @Size(max = 1000)
    private String storagePath;

    @Size(max = 255)
    private String altText;

    @PositiveOrZero
    private Integer sortOrder;

    private Boolean isPrimary;
}
