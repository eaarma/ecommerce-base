package com.ecommercestore.backend.product;

import com.ecommercestore.backend.product.dto.CreateProductRequest;
import com.ecommercestore.backend.product.dto.ProductImageRequest;
import com.ecommercestore.backend.product.dto.ProductImageResponse;
import com.ecommercestore.backend.product.dto.ProductResponse;
import com.ecommercestore.backend.product.dto.ProductVariantRequest;
import com.ecommercestore.backend.product.dto.ProductVariantResponse;
import com.ecommercestore.backend.product.dto.UpdateProductRequest;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ProductMapper {

    public Product toEntity(CreateProductRequest request) {
        Product product = Product.builder().build();
        updateEntity(request, product);
        return product;
    }

    public void updateEntity(CreateProductRequest request, Product product) {
        applyBaseFields(
                product,
                request.getName(),
                request.getSlug(),
                request.getDescription(),
                request.getBasePrice(),
                request.getCategory(),
                request.getStatus(),
                request.getMainImageUrl(),
                request.getTraitsJson());

        Map<ProductVariant, ProductVariantRequest> variantRequestsByEntity = replaceVariants(product, request.getVariants());
        replaceImages(product, request.getImages(), request.getMainImageUrl(), variantRequestsByEntity);
    }

    public void updateEntity(UpdateProductRequest request, Product product) {
        applyBaseFields(
                product,
                request.getName(),
                request.getSlug(),
                request.getDescription(),
                request.getBasePrice(),
                request.getCategory(),
                request.getStatus(),
                request.getMainImageUrl(),
                request.getTraitsJson());

        Map<ProductVariant, ProductVariantRequest> variantRequestsByEntity = replaceVariants(product, request.getVariants());
        replaceImages(product, request.getImages(), request.getMainImageUrl(), variantRequestsByEntity);
    }

    public ProductResponse toResponse(Product product) {
        List<ProductImage> orderedImages = orderImages(product.getImages());
        Map<Long, List<ProductImageResponse>> variantImagesById = mapVariantImages(orderedImages);

        List<ProductVariantResponse> variants = product.getVariants()
                .stream()
                .map(variant -> toVariantResponse(
                        variant,
                        variantImagesById.getOrDefault(variant.getId(), List.of())))
                .toList();

        List<ProductImageResponse> images = orderedImages
                .stream()
                .filter(image -> image.getVariant() == null)
                .map(this::toImageResponse)
                .toList();

        Integer stockQuantity = resolveStockQuantity(product);
        ProductStatus status = resolveResponseStatus(product, stockQuantity);
        String mainImageUrl = resolvePrimaryProductImageUrl(product);

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .basePrice(product.getBasePrice())
                .price(resolveDisplayPrice(product))
                .stockQuantity(stockQuantity)
                .category(product.getCategory())
                .status(status)
                .mainImageUrl(mainImageUrl)
                .imageUrl(resolveDisplayImageUrl(product))
                .traitsJson(product.getTraitsJson())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .variants(variants)
                .images(images)
                .build();
    }

    public ProductStatus resolveResponseStatus(Product product, Integer stockQuantity) {
        if (product.getStatus() == ProductStatus.ARCHIVED || product.getStatus() == ProductStatus.DRAFT) {
            return product.getStatus();
        }

        if (stockQuantity != null && stockQuantity > 0) {
            return ProductStatus.ACTIVE;
        }

        return ProductStatus.OUT_OF_STOCK;
    }

    public BigDecimal resolveDisplayPrice(Product product) {
        return product.getPrice() != null ? product.getPrice() : product.getBasePrice();
    }

    public Integer resolveStockQuantity(Product product) {
        if (product.getStockQuantity() != null) {
            return Math.max(product.getStockQuantity(), 0);
        }

        return product.getVariants()
                .stream()
                .filter(this::isPublicVariant)
                .map(ProductVariant::getStockQuantity)
                .filter(Objects::nonNull)
                .reduce(0, Integer::sum);
    }

    public String resolveDisplayImageUrl(Product product) {
        String primaryProductImageUrl = resolvePrimaryProductImageUrl(product);
        if (primaryProductImageUrl != null) {
            return primaryProductImageUrl;
        }

        return product.getVariants()
                .stream()
                .map(ProductVariant::getImageUrl)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .findFirst()
                .orElseGet(() -> orderImages(product.getImages())
                        .stream()
                        .map(ProductImage::getUrl)
                        .filter(StringUtils::hasText)
                        .map(String::trim)
                        .findFirst()
                        .orElse(null));
    }

    public String buildVariantLabel(ProductVariant variant) {
        List<String> parts = new ArrayList<>();

        appendIfPresent(parts, variant.getColor());
        appendIfPresent(parts, variant.getSize());
        appendIfPresent(parts, variant.getWeight());
        appendIfPresent(parts, variant.getMaterial());

        return parts.isEmpty() ? "Default" : String.join(" / ", parts);
    }

    private ProductVariantResponse toVariantResponse(
            ProductVariant variant,
            List<ProductImageResponse> images) {
        return ProductVariantResponse.builder()
                .id(variant.getId())
                .sku(variant.getSku())
                .color(variant.getColor())
                .size(variant.getSize())
                .weight(variant.getWeight())
                .material(variant.getMaterial())
                .label(buildVariantLabel(variant))
                .price(variant.getPrice())
                .stockQuantity(variant.getStockQuantity())
                .imageUrl(resolveVariantDisplayImageUrl(images, variant.getImageUrl()))
                .images(images)
                .status(variant.getStatus())
                .createdAt(variant.getCreatedAt())
                .updatedAt(variant.getUpdatedAt())
                .build();
    }

    public ProductImageResponse toImageResponse(ProductImage image) {
        return ProductImageResponse.builder()
                .id(image.getId())
                .variantId(image.getVariant() != null ? image.getVariant().getId() : null)
                .imageUrl(image.getUrl())
                .storagePath(image.getStoragePath())
                .altText(image.getAltText())
                .sortOrder(image.getSortOrder())
                .isPrimary(Boolean.TRUE.equals(image.getIsPrimary()))
                .createdAt(image.getCreatedAt())
                .updatedAt(image.getUpdatedAt())
                .build();
    }

    private void applyBaseFields(
            Product product,
            String name,
            String slug,
            String description,
            BigDecimal basePrice,
            ProductCategory category,
            ProductStatus status,
            String mainImageUrl,
            String traitsJson) {
        product.setName(normalizeRequired(name));
        product.setSlug(normalizeSlugValue(slug));
        product.setDescription(normalizeRequired(description));
        product.setBasePrice(basePrice);
        product.setCategory(category);
        product.setStatus(status != null ? status : ProductStatus.DRAFT);
        product.setMainImageUrl(normalizeOptional(mainImageUrl));
        product.setTraitsJson(normalizeOptional(traitsJson));
    }

    private Map<ProductVariant, ProductVariantRequest> replaceVariants(Product product, List<ProductVariantRequest> requests) {
        Map<Long, ProductVariant> existingVariantsById = product.getVariants()
                .stream()
                .filter(variant -> variant.getId() != null)
                .collect(Collectors.toMap(ProductVariant::getId, variant -> variant));

        List<ProductVariant> nextVariants = new ArrayList<>();
        Map<ProductVariant, ProductVariantRequest> variantRequestsByEntity = new LinkedHashMap<>();

        for (ProductVariantRequest request : requests) {
            ProductVariant variant = request.getId() != null
                    ? existingVariantsById.getOrDefault(request.getId(), ProductVariant.builder().build())
                    : ProductVariant.builder().build();

            variant.setSku(normalizeRequired(request.getSku()));
            variant.setColor(normalizeOptional(request.getColor()));
            variant.setSize(normalizeOptional(request.getSize()));
            variant.setWeight(normalizeOptional(request.getWeight()));
            variant.setMaterial(normalizeOptional(request.getMaterial()));
            variant.setPrice(request.getPrice());
            variant.setStockQuantity(request.getStockQuantity());
            variant.setImageUrl(normalizeOptional(request.getImageUrl()));
            variant.setStatus(request.getStatus() != null ? request.getStatus() : ProductStatus.DRAFT);
            variant.setProduct(product);
            nextVariants.add(variant);
            variantRequestsByEntity.put(variant, request);
        }

        product.getVariants().clear();
        nextVariants.forEach(product::addVariant);
        return variantRequestsByEntity;
    }

    private void replaceImages(
            Product product,
            List<ProductImageRequest> requests,
            String legacyMainImageUrl,
            Map<ProductVariant, ProductVariantRequest> variantRequestsByEntity) {
        List<ProductImageRequest> safeRequests = requests == null ? List.of() : requests;
        Map<Long, ProductImage> existingImagesById = product.getImages()
                .stream()
                .filter(image -> image.getId() != null)
                .collect(Collectors.toMap(ProductImage::getId, image -> image));

        List<ProductImage> nextImages = new ArrayList<>();

        appendImages(nextImages, product, null, safeRequests, legacyMainImageUrl, existingImagesById);

        for (Map.Entry<ProductVariant, ProductVariantRequest> entry : variantRequestsByEntity.entrySet()) {
            ProductVariant variant = entry.getKey();
            ProductVariantRequest variantRequest = entry.getValue();

            appendImages(
                    nextImages,
                    product,
                    variant,
                    variantRequest.getImages(),
                    variantRequest.getImageUrl(),
                    existingImagesById);
        }

        product.getImages().clear();
        nextImages.forEach(product::addImage);
        syncLegacyImageFields(product);
    }

    private void appendImages(
            List<ProductImage> nextImages,
            Product product,
            ProductVariant variant,
            List<ProductImageRequest> requests,
            String legacyImageUrl,
            Map<Long, ProductImage> existingImagesById) {
        List<ProductImageRequest> safeRequests = requests == null ? List.of() : requests;

        if (safeRequests.isEmpty()) {
            String normalizedLegacyImageUrl = normalizeOptional(legacyImageUrl);
            if (normalizedLegacyImageUrl == null) {
                return;
            }

            ProductImage image = ProductImage.builder().build();
            image.setUrl(normalizedLegacyImageUrl);
            image.setStoragePath(null);
            image.setAltText(null);
            image.setSortOrder(0);
            image.setIsPrimary(true);
            image.setVariant(variant);
            image.setProduct(product);
            nextImages.add(image);
            return;
        }

        int primaryImageIndex = findPrimaryImageIndex(safeRequests);

        for (int index = 0; index < safeRequests.size(); index++) {
            ProductImageRequest request = safeRequests.get(index);
            ProductImage image = request.getId() != null
                    ? existingImagesById.getOrDefault(request.getId(), ProductImage.builder().build())
                    : ProductImage.builder().build();

            image.setUrl(normalizeRequired(request.getImageUrl()));
            image.setStoragePath(normalizeOptional(request.getStoragePath()));
            image.setAltText(normalizeOptional(request.getAltText()));
            image.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : index);
            image.setIsPrimary(index == primaryImageIndex);
            image.setVariant(variant);
            image.setProduct(product);
            nextImages.add(image);
        }
    }

    private int findPrimaryImageIndex(List<ProductImageRequest> requests) {
        for (int index = 0; index < requests.size(); index++) {
            if (Boolean.TRUE.equals(requests.get(index).getIsPrimary())) {
                return index;
            }
        }

        return requests.isEmpty() ? -1 : 0;
    }

    private void syncLegacyImageFields(Product product) {
        product.setMainImageUrl(resolvePrimaryProductImageUrl(product));

        for (ProductVariant variant : product.getVariants()) {
            String variantImageUrl = orderImages(product.getImages().stream()
                    .filter(image -> image.getVariant() == variant)
                    .toList())
                    .stream()
                    .map(ProductImage::getUrl)
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .findFirst()
                    .orElse(null);
            variant.setImageUrl(variantImageUrl);
        }
    }

    private String resolvePrimaryProductImageUrl(Product product) {
        return orderImages(product.getImages().stream()
                .filter(image -> image.getVariant() == null)
                .toList())
                .stream()
                .map(ProductImage::getUrl)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .findFirst()
                .orElse(null);
    }

    private String resolveVariantDisplayImageUrl(
            List<ProductImageResponse> images,
            String legacyImageUrl) {
        String imageUrl = images.stream()
                .map(ProductImageResponse::getImageUrl)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .findFirst()
                .orElse(null);

        return imageUrl != null ? imageUrl : normalizeOptional(legacyImageUrl);
    }

    private List<ProductImage> orderImages(List<ProductImage> images) {
        return images.stream()
                .sorted(Comparator
                        .comparing(ProductImage::getIsPrimary, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(ProductImage::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(ProductImage::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private Map<Long, List<ProductImageResponse>> mapVariantImages(List<ProductImage> images) {
        Map<Long, List<ProductImageResponse>> imagesByVariantId = new HashMap<>();

        for (ProductImage image : images) {
            if (image.getVariant() == null || image.getVariant().getId() == null) {
                continue;
            }

            imagesByVariantId.computeIfAbsent(image.getVariant().getId(), ignored -> new ArrayList<>())
                    .add(toImageResponse(image));
        }

        return imagesByVariantId;
    }

    private boolean isPublicVariant(ProductVariant variant) {
        return variant.getStatus() == ProductStatus.ACTIVE
                || variant.getStatus() == ProductStatus.OUT_OF_STOCK;
    }

    private void appendIfPresent(List<String> parts, String value) {
        String normalized = normalizeOptional(value);
        if (normalized != null) {
            parts.add(normalized);
        }
    }

    public String normalizeSlugValue(String value) {
        String normalized = normalizeRequired(value)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");

        if (!StringUtils.hasText(normalized)) {
            throw new IllegalArgumentException("Slug must contain at least one letter or number.");
        }

        return normalized;
    }

    private String normalizeRequired(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new IllegalArgumentException("Required text value is missing.");
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.trim();
    }
}
