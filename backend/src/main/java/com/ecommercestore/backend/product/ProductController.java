package com.ecommercestore.backend.product;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

import com.ecommercestore.backend.product.dto.ProductResponse;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_PAGE_SIZE = 48;
    private static final String DEFAULT_SORT = "updatedAt,desc";
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "name",
            "price",
            "createdAt",
            "updatedAt",
            "stockQuantity");

    private final ProductService productService;

    @GetMapping(params = { "page", "size" })
    public Page<ProductResponse> getProductsPage(
            @RequestParam("page") int page,
            @RequestParam("size") int size,
            @RequestParam(value = "sort", defaultValue = DEFAULT_SORT) String sort,
            @RequestParam(value = "availability", required = false) List<ProductAvailability> availability,
            @RequestParam(value = "priceRange", required = false) List<ProductPriceRange> priceRange) {
        return productService.getPublicProductsPage(
                availability,
                priceRange,
                buildPageable(page, size, sort));
    }

    @GetMapping
    public List<ProductResponse> getProducts() {
        return productService.getPublicProducts();
    }

    @GetMapping("/{productId}")
    public ProductResponse getProductById(@PathVariable("productId") Long productId) {
        return productService.getProductById(productId);
    }

    private Pageable buildPageable(int page, int size, String sort) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        String[] sortParts = sort == null ? new String[0] : sort.split(",");

        String property = DEFAULT_SORT.split(",")[0];
        Sort.Direction direction = Sort.Direction.DESC;

        if (sortParts.length > 0 && ALLOWED_SORT_FIELDS.contains(sortParts[0])) {
            property = sortParts[0];
        }

        if (sortParts.length > 1) {
            direction = Sort.Direction.fromOptionalString(sortParts[1]).orElse(Sort.Direction.DESC);
        }

        return PageRequest.of(safePage, safeSize, Sort.by(direction, property));
    }
}
