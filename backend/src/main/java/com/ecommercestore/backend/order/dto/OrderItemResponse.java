package com.ecommercestore.backend.order.dto;

import com.ecommercestore.backend.order.OrderItemStatus;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productSnapshotId,
        String productSnapshotName,
        String productSnapshotImageUrl,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal lineTotal,
        OrderItemStatus status
) {
}
