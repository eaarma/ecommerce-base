package com.ecommercestore.backend.product.dto;

import com.ecommercestore.backend.product.ProductStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
public class ProductVariantResponse {

    private Long id;
    private String sku;
    private String color;
    private String size;
    private String weight;
    private String material;
    private String label;
    private BigDecimal price;
    private Integer stockQuantity;
    private String imageUrl;
    private List<ProductImageResponse> images;
    private ProductStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
