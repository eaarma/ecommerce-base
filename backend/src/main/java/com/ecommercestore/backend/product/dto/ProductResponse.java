package com.ecommercestore.backend.product.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.ecommercestore.backend.product.ProductStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private Long id;

    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;

    private ProductStatus status;

    private String imageUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}