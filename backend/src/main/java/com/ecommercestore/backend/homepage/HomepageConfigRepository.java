package com.ecommercestore.backend.homepage;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HomepageConfigRepository extends JpaRepository<HomepageConfig, Long> {

    Optional<HomepageConfig> findFirstByOrderByIdAsc();
}
