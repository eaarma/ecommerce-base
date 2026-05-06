package com.ecommercestore.backend.order.dto;

import com.ecommercestore.backend.order.OrderItemStatus;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productSnapshotId,
        String productSnapshotName,
        String productSnapshotImageUrl,
        Long variantSnapshotId,
        String variantSnapshotSku,
        String variantSnapshotLabel,
        String variantSnapshotColor,
        String variantSnapshotSize,
        String variantSnapshotWeight,
        String variantSnapshotMaterial,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal lineTotal,
        OrderItemStatus status
) {
}
