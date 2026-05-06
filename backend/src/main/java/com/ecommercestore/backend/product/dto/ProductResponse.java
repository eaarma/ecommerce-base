package com.ecommercestore.backend.product.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.ecommercestore.backend.product.ProductCategory;
import com.ecommercestore.backend.product.ProductStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private Long id;

    private String name;
    private String slug;
    private String description;
    private BigDecimal basePrice;
    private BigDecimal price;
    private Integer stockQuantity;

    private ProductCategory category;
    private ProductStatus status;

    private String mainImageUrl;
    private String imageUrl;
    private String traitsJson;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<ProductVariantResponse> variants;
    private List<ProductImageResponse> images;
}
