package com.ecommercestore.backend.product.dto;

import com.ecommercestore.backend.product.ProductStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
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
public class ProductVariantRequest {

    private Long id;

    @NotBlank
    @Size(max = 120)
    private String sku;

    @Size(max = 120)
    private String color;

    @Size(max = 120)
    private String size;

    @Size(max = 120)
    private String weight;

    @Size(max = 120)
    private String material;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal price;

    @NotNull
    @Min(0)
    private Integer stockQuantity;

    @Size(max = 500)
    private String imageUrl;

    @Valid
    private List<ProductImageRequest> images;

    private ProductStatus status;
}
