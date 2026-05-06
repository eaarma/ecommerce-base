package com.ecommercestore.backend.product;

import com.ecommercestore.backend.product.dto.CreateProductImageRecordRequest;
import com.ecommercestore.backend.product.dto.ProductImageResponse;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductImageService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public ProductImageResponse createProductImage(Long productId, CreateProductImageRecordRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found."));
        product.getVariants().size();
        product.getImages().size();

        ProductVariant variant = resolveVariant(product, request.getVariantId());
        List<ProductImage> scopedImages = product.getImages().stream()
                .filter(image -> isSameScope(image, variant))
                .toList();

        boolean isPrimary = request.getIsPrimary() != null
                ? request.getIsPrimary()
                : scopedImages.isEmpty();
        if (!isPrimary && scopedImages.isEmpty()) {
            isPrimary = true;
        }

        if (isPrimary) {
            scopedImages.forEach(image -> image.setIsPrimary(false));
        }

        ProductImage image = ProductImage.builder()
                .url(normalizeRequired(request.getImageUrl(), "Image URL"))
                .storagePath(normalizeOptional(request.getStoragePath()))
                .altText(normalizeOptional(request.getAltText()))
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : nextSortOrder(scopedImages))
                .isPrimary(isPrimary)
                .variant(variant)
                .build();

        product.addImage(image);
        syncLegacyImageFields(product, variant, image, isPrimary, scopedImages.isEmpty());

        productRepository.saveAndFlush(product);
        return productMapper.toImageResponse(image);
    }

    private ProductVariant resolveVariant(Product product, Long variantId) {
        if (variantId == null) {
            return null;
        }

        return product.getVariants().stream()
                .filter(candidate -> variantId.equals(candidate.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Variant does not belong to this product."));
    }

    private boolean isSameScope(ProductImage image, ProductVariant variant) {
        Long imageVariantId = image.getVariant() != null ? image.getVariant().getId() : null;
        Long targetVariantId = variant != null ? variant.getId() : null;
        return java.util.Objects.equals(imageVariantId, targetVariantId);
    }

    private int nextSortOrder(List<ProductImage> images) {
        return images.stream()
                .map(ProductImage::getSortOrder)
                .filter(java.util.Objects::nonNull)
                .max(Comparator.naturalOrder())
                .map(value -> value + 1)
                .orElse(0);
    }

    private void syncLegacyImageFields(
            Product product,
            ProductVariant variant,
            ProductImage image,
            boolean isPrimary,
            boolean isFirstInScope) {
        if (variant != null) {
            if (isPrimary || isFirstInScope || !StringUtils.hasText(variant.getImageUrl())) {
                variant.setImageUrl(image.getUrl());
            }
            return;
        }

        if (isPrimary || isFirstInScope || !StringUtils.hasText(product.getMainImageUrl())) {
            product.setMainImageUrl(image.getUrl());
        }
    }

    private String normalizeOptional(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.trim();
    }

    private String normalizeRequired(String value, String fieldName) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }

        return normalized;
    }
}
