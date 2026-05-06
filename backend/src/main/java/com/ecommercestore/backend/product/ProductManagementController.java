package com.ecommercestore.backend.product;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.ecommercestore.backend.product.dto.CreateProductImageRecordRequest;
import com.ecommercestore.backend.product.dto.CreateProductRequest;
import com.ecommercestore.backend.product.dto.ProductImageResponse;
import com.ecommercestore.backend.product.dto.ProductResponse;
import com.ecommercestore.backend.product.dto.UpdateProductRequest;

@RestController
@RequestMapping("/api/manager/products")
@RequiredArgsConstructor
public class ProductManagementController {

    private final ProductService productService;
    private final ProductImageService productImageService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse createProduct(@Valid @RequestBody CreateProductRequest request) {
        return productService.createProduct(request);
    }

    @GetMapping
    public List<ProductResponse> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{productId}")
    public ProductResponse getProductById(@PathVariable("productId") Long productId) {
        return productService.getProductById(productId);
    }

    @PutMapping("/{productId}")
    public ProductResponse updateProduct(
            @PathVariable("productId") Long productId,
            @Valid @RequestBody UpdateProductRequest request) {
        return productService.updateProduct(productId, request);
    }

    @PostMapping("/{productId}/images")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductImageResponse createProductImage(
            @PathVariable("productId") Long productId,
            @Valid @RequestBody CreateProductImageRecordRequest request) {
        return productImageService.createProductImage(productId, request);
    }

    @PatchMapping("/{productId}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archiveProduct(@PathVariable("productId") Long productId) {
        productService.archiveProduct(productId);
    }
}
