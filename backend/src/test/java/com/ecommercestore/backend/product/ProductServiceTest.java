package com.ecommercestore.backend.product;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ecommercestore.backend.product.dto.CreateProductRequest;
import com.ecommercestore.backend.product.dto.ProductVariantRequest;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    private ProductService productService;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, productVariantRepository, new ProductMapper());
    }

    @Test
    void createProductRejectsDuplicateVariantDefinitions() {
        CreateProductRequest request = CreateProductRequest.builder()
                .name("Structured Tee")
                .slug("structured-tee")
                .description("Duplicate variant definitions should fail.")
                .basePrice(new BigDecimal("29.90"))
                .status(ProductStatus.ACTIVE)
                .variants(List.of(
                        ProductVariantRequest.builder()
                                .sku("TEE-BLK-S")
                                .color("Black")
                                .size("S")
                                .price(new BigDecimal("29.90"))
                                .stockQuantity(10)
                                .status(ProductStatus.ACTIVE)
                                .build(),
                        ProductVariantRequest.builder()
                                .sku("TEE-BLK-S-2")
                                .color(" black ")
                                .size("s")
                                .price(new BigDecimal("29.90"))
                                .stockQuantity(5)
                                .status(ProductStatus.ACTIVE)
                                .build()))
                .build();

        when(productRepository.existsBySlugIgnoreCase("structured-tee")).thenReturn(false);
        when(productVariantRepository.existsBySkuIgnoreCase("TEE-BLK-S")).thenReturn(false);
        when(productVariantRepository.existsBySkuIgnoreCase("TEE-BLK-S-2")).thenReturn(false);

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Variant attribute combinations must be unique within a product.");

        verify(productRepository, never()).saveAndFlush(any(Product.class));
    }
}
