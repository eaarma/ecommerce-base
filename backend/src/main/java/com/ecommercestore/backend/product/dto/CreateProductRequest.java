package com.ecommercestore.backend.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import com.ecommercestore.backend.product.ProductCategory;
import com.ecommercestore.backend.product.ProductStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProductRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    @NotBlank
    @Size(max = 180)
    private String slug;

    @NotBlank
    @Size(max = 2000)
    private String description;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal basePrice;

    private ProductCategory category;

    @Size(max = 500)
    private String mainImageUrl;

    @Size(max = 5000)
    private String traitsJson;

    private ProductStatus status;

    @NotEmpty
    @Valid
    private List<ProductVariantRequest> variants;

    @Valid
    private List<ProductImageRequest> images;
}
