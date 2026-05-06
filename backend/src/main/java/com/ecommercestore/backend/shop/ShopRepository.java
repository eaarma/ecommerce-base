package com.ecommercestore.backend.shop;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopRepository extends JpaRepository<Shop, Long> {

    Optional<Shop> findFirstByOrderByIdAsc();
}
