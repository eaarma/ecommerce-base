package com.ecommercestore.backend.storepage;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StorePageRepository extends JpaRepository<StorePage, Long> {

    Optional<StorePage> findBySlug(String slug);

    Optional<StorePage> findBySlugAndStatus(String slug, StorePageStatus status);

    List<StorePage> findAllByOrderByIdAsc();
}
