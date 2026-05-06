package com.ecommercestore.backend.homepage;

import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommercestore.backend.homepage.dto.HomepageCollectionBlockDto;
import com.ecommercestore.backend.homepage.dto.HomepageConfigPublicResponse;
import com.ecommercestore.backend.homepage.dto.HomepageConfigResponse;
import com.ecommercestore.backend.homepage.dto.UpdateHomepageConfigRequest;
import com.ecommercestore.backend.product.Product;
import com.ecommercestore.backend.product.ProductRepository;
import com.ecommercestore.backend.product.ProductStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomepageConfigService {

    private static final Long DEFAULT_HOMEPAGE_CONFIG_ID = 1L;
    private static final Set<ProductStatus> PUBLIC_VISIBLE_PRODUCT_STATUSES = Set.of(
            ProductStatus.ACTIVE,
            ProductStatus.OUT_OF_STOCK);

    private final HomepageConfigRepository homepageConfigRepository;
    private final HomepageConfigMapper homepageConfigMapper;
    private final ProductRepository productRepository;

    public HomepageConfigPublicResponse getPublicHomepageConfig() {
        return homepageConfigMapper.toPublicResponse(findDefaultConfig());
    }

    public HomepageConfigResponse getManagerHomepageConfig() {
        return homepageConfigMapper.toResponse(findDefaultConfig());
    }

    @Transactional
    public HomepageConfigResponse updateHomepageConfig(UpdateHomepageConfigRequest request) {
        validateReferencedProducts(request);

        HomepageConfig config = findDefaultConfig();
        homepageConfigMapper.updateEntity(request, config);

        HomepageConfig savedConfig = homepageConfigRepository.save(config);
        return homepageConfigMapper.toResponse(savedConfig);
    }

    private HomepageConfig findDefaultConfig() {
        return homepageConfigRepository.findById(DEFAULT_HOMEPAGE_CONFIG_ID)
                .or(() -> homepageConfigRepository.findFirstByOrderByIdAsc())
                .orElseThrow(() -> new NoSuchElementException(
                        "Homepage configuration has not been initialized."));
    }

    private void validateReferencedProducts(UpdateHomepageConfigRequest request) {
        Set<Long> referencedProductIds = new HashSet<>();

        if (request.getFeaturedProductIds() != null) {
            for (Long productId : request.getFeaturedProductIds()) {
                if (productId == null) {
                    throw new IllegalArgumentException("Featured product ids cannot contain null values.");
                }

                referencedProductIds.add(productId);
            }
        }

        if (request.getSpotlightProductId() != null) {
            referencedProductIds.add(request.getSpotlightProductId());
        }

        if (request.getCollectionBlocks() != null) {
            for (HomepageCollectionBlockDto block : request.getCollectionBlocks()) {
                if (block == null) {
                    throw new IllegalArgumentException("Collection blocks cannot contain null items.");
                }

                if (block.getProductId() != null) {
                    referencedProductIds.add(block.getProductId());
                }
            }
        }

        if (referencedProductIds.isEmpty()) {
            return;
        }

        List<Product> products = productRepository.findAllById(referencedProductIds);
        Set<Long> visibleProductIds = products.stream()
                .filter(product -> PUBLIC_VISIBLE_PRODUCT_STATUSES.contains(product.getStatus()))
                .map(Product::getId)
                .collect(java.util.stream.Collectors.toSet());

        List<Long> invalidIds = referencedProductIds.stream()
                .filter(productId -> !visibleProductIds.contains(productId))
                .sorted()
                .toList();

        if (!invalidIds.isEmpty()) {
            throw new IllegalArgumentException(
                    "Homepage product references must point to active or out-of-stock products. Invalid ids: "
                            + invalidIds);
        }
    }
}
