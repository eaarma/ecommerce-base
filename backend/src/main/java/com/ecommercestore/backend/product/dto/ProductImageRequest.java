package com.ecommercestore.backend.product.dto;

import jakarta.validation.constraints.NotBlank;
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

    private Long id;

    private Long variantId;

    @NotBlank
    @Size(max = 500)
    private String imageUrl;

    @Size(max = 1000)
    private String storagePath;

    @Size(max = 255)
    private String altText;

    private Integer sortOrder;

    private Boolean isPrimary;
}
