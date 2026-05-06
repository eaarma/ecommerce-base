package com.ecommercestore.backend.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    List<Product> findByStatus(ProductStatus status);

    List<Product> findByStatusOrderByCreatedAtDesc(ProductStatus status);

    List<Product> findByStatusInOrderByCreatedAtDesc(List<ProductStatus> statuses);

    boolean existsBySlugIgnoreCase(String slug);

    boolean existsBySlugIgnoreCaseAndIdNot(String slug, Long id);
}
