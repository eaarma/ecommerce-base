package com.ecommercestore.backend.product;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ecommercestore.backend.product.dto.CreateProductRequest;
import com.ecommercestore.backend.product.dto.ProductResponse;
import com.ecommercestore.backend.product.dto.UpdateProductRequest;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public ProductResponse createProduct(CreateProductRequest request) {
        Product product = productMapper.toEntity(request);

        if (product.getStatus() == null) {
            product.setStatus(ProductStatus.DRAFT);
        }

        Product savedProduct = productRepository.save(product);
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
    public List<ProductResponse> getActiveProducts() {
        return productRepository.findByStatusOrderByCreatedAtDesc(ProductStatus.ACTIVE)
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long productId) {
        Product product = findProductById(productId);
        return productMapper.toResponse(product);
    }

    public ProductResponse updateProduct(Long productId, UpdateProductRequest request) {
        Product product = findProductById(productId);

        productMapper.updateEntity(request, product);

        if (product.getStockQuantity() != null
                && product.getStockQuantity() == 0
                && product.getStatus() == ProductStatus.ACTIVE) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        }

        Product updatedProduct = productRepository.save(product);
        return productMapper.toResponse(updatedProduct);
    }

    public void archiveProduct(Long productId) {
        Product product = findProductById(productId);
        product.setStatus(ProductStatus.ARCHIVED);
        productRepository.save(product);
    }

    private Product findProductById(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
    }
}
