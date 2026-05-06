package com.ecommercestore.backend.product;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    boolean existsByStoragePath(String storagePath);
}
