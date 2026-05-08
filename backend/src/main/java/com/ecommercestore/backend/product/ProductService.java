package com.ecommercestore.backend.product;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;

import com.ecommercestore.backend.product.dto.CreateProductRequest;
import com.ecommercestore.backend.product.dto.ProductResponse;
import com.ecommercestore.backend.product.dto.UpdateProductRequest;

import jakarta.persistence.criteria.Predicate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private static final List<ProductStatus> PUBLIC_VISIBLE_STATUSES = List.of(
            ProductStatus.ACTIVE,
            ProductStatus.OUT_OF_STOCK);

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductMapper productMapper;

    public ProductResponse createProduct(CreateProductRequest request) {
        validateProductSlug(productMapper.normalizeSlugValue(request.getSlug()), null);
        validateVariantSkus(request.getVariants());
        validateVariantDefinitions(request.getVariants());

        Product product = productMapper.toEntity(request);
        syncProductStatus(product);

        Product savedProduct = productRepository.saveAndFlush(product);
        return productMapper.toResponse(savedProduct);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getPublicProducts() {
        return productRepository.findByStatusInOrderByCreatedAtDesc(PUBLIC_VISIBLE_STATUSES)
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getPublicProductsPage(
            List<ProductAvailability> availabilityFilters,
            List<ProductPriceRange> priceRangeFilters,
            Pageable pageable) {
        return productRepository.findAll(
                buildPublicProductSpecification(availabilityFilters, priceRangeFilters),
                pageable).map(productMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long productId) {
        Product product = findProductById(productId);
        return productMapper.toResponse(product);
    }

    public ProductResponse updateProduct(Long productId, UpdateProductRequest request) {
        Product product = findProductById(productId);
        validateProductSlug(productMapper.normalizeSlugValue(request.getSlug()), productId);
        validateVariantSkus(request.getVariants());
        validateVariantDefinitions(request.getVariants());
        productMapper.updateEntity(request, product);
        syncProductStatus(product);

        Product updatedProduct = productRepository.saveAndFlush(product);
        return productMapper.toResponse(updatedProduct);
    }

    public void archiveProduct(Long productId) {
        Product product = findProductById(productId);
        product.setStatus(ProductStatus.ARCHIVED);
        productRepository.save(product);
    }

    public void syncProductStatus(Product product) {
        product.getVariants().forEach(this::syncVariantStatus);

        if (product.getStatus() == ProductStatus.ARCHIVED || product.getStatus() == ProductStatus.DRAFT) {
            return;
        }

        boolean hasStock = product.getVariants()
                .stream()
                .anyMatch(variant -> variant.getStatus() == ProductStatus.ACTIVE
                        && variant.getStockQuantity() != null
                        && variant.getStockQuantity() > 0);

        product.setStatus(hasStock ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK);
    }

    private Specification<Product> buildPublicProductSpecification(
            List<ProductAvailability> availabilityFilters,
            List<ProductPriceRange> priceRangeFilters) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(root.get("status").in(PUBLIC_VISIBLE_STATUSES));

            if (availabilityFilters != null && !availabilityFilters.isEmpty()) {
                List<Predicate> availabilityPredicates = new ArrayList<>();

                for (ProductAvailability availability : availabilityFilters) {
                    if (availability == ProductAvailability.IN_STOCK) {
                        availabilityPredicates.add(criteriaBuilder.greaterThan(root.get("stockQuantity"), 0));
                    } else if (availability == ProductAvailability.OUT_OF_STOCK) {
                        availabilityPredicates.add(criteriaBuilder.or(
                                criteriaBuilder.equal(root.get("status"), ProductStatus.OUT_OF_STOCK),
                                criteriaBuilder.lessThanOrEqualTo(root.get("stockQuantity"), 0)));
                    }
                }

                if (!availabilityPredicates.isEmpty()) {
                    predicates.add(criteriaBuilder.or(availabilityPredicates.toArray(new Predicate[0])));
                }
            }

            if (priceRangeFilters != null && !priceRangeFilters.isEmpty()) {
                List<Predicate> pricePredicates = new ArrayList<>();

                for (ProductPriceRange priceRange : priceRangeFilters) {
                    switch (priceRange) {
                        case UNDER_25 -> pricePredicates.add(
                                criteriaBuilder.lessThan(root.get("price"), BigDecimal.valueOf(25)));
                        case BETWEEN_25_AND_50 -> pricePredicates.add(criteriaBuilder.and(
                                criteriaBuilder.greaterThanOrEqualTo(root.get("price"), BigDecimal.valueOf(25)),
                                criteriaBuilder.lessThan(root.get("price"), BigDecimal.valueOf(50))));
                        case BETWEEN_50_AND_100 -> pricePredicates.add(criteriaBuilder.and(
                                criteriaBuilder.greaterThanOrEqualTo(root.get("price"), BigDecimal.valueOf(50)),
                                criteriaBuilder.lessThan(root.get("price"), BigDecimal.valueOf(100))));
                        case OVER_100 -> pricePredicates.add(
                                criteriaBuilder.greaterThanOrEqualTo(root.get("price"), BigDecimal.valueOf(100)));
                        default -> {
                        }
                    }
                }

                if (!pricePredicates.isEmpty()) {
                    predicates.add(criteriaBuilder.or(pricePredicates.toArray(new Predicate[0])));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Product findProductById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        // Initialize both collections inside the transaction without a multi-bag join fetch.
        product.getVariants().size();
        product.getImages().size();

        return product;
    }

    private void validateProductSlug(String slug, Long productId) {
        boolean exists = productId == null
                ? productRepository.existsBySlugIgnoreCase(slug)
                : productRepository.existsBySlugIgnoreCaseAndIdNot(slug, productId);

        if (exists) {
            throw new IllegalArgumentException("A product with this slug already exists.");
        }
    }

    private void validateVariantSkus(List<com.ecommercestore.backend.product.dto.ProductVariantRequest> variants) {
        var seenSkus = new java.util.HashSet<String>();

        for (var variant : variants) {
            String sku = variant.getSku().trim();

            if (!seenSkus.add(sku.toLowerCase(java.util.Locale.ROOT))) {
                throw new IllegalArgumentException("Variant SKUs must be unique within a product.");
            }

            boolean exists = variant.getId() == null
                    ? productVariantRepository.existsBySkuIgnoreCase(sku)
                    : productVariantRepository.existsBySkuIgnoreCaseAndIdNot(sku, variant.getId());

            if (exists) {
                throw new IllegalArgumentException("Variant SKU already exists: " + sku);
            }
        }
    }

    private void validateVariantDefinitions(List<com.ecommercestore.backend.product.dto.ProductVariantRequest> variants) {
        var seenDefinitions = new java.util.HashSet<String>();

        for (var variant : variants) {
            String definitionKey = String.join("|",
                    normalizeVariantAttribute(variant.getColor()),
                    normalizeVariantAttribute(variant.getSize()),
                    normalizeVariantAttribute(variant.getWeight()),
                    normalizeVariantAttribute(variant.getMaterial()));

            if (!seenDefinitions.add(definitionKey)) {
                throw new IllegalArgumentException("Variant attribute combinations must be unique within a product.");
            }
        }
    }

    private String normalizeVariantAttribute(String value) {
        if (value == null) {
            return "";
        }

        String normalized = value.trim();
        return normalized.toLowerCase(java.util.Locale.ROOT);
    }

    private void syncVariantStatus(ProductVariant variant) {
        if (variant.getStatus() == ProductStatus.ARCHIVED || variant.getStatus() == ProductStatus.DRAFT) {
            return;
        }

        variant.setStatus(
                variant.getStockQuantity() != null && variant.getStockQuantity() > 0
                        ? ProductStatus.ACTIVE
                        : ProductStatus.OUT_OF_STOCK);
    }
}
