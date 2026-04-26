package com.ecommercestore.backend.product;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.ecommercestore.backend.product.dto.CreateProductRequest;
import com.ecommercestore.backend.product.dto.ProductResponse;
import com.ecommercestore.backend.product.dto.UpdateProductRequest;

@RestController
@RequestMapping("/api/manager/products")
@RequiredArgsConstructor
public class ProductManagementController {

    private final ProductService productService;

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

    @PatchMapping("/{productId}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archiveProduct(@PathVariable("productId") Long productId) {
        productService.archiveProduct(productId);
    }
}