package com.ecommercestore.backend.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = { "items", "delivery" })
    Optional<Order> findByIdAndReservationToken(Long id, UUID reservationToken);

    @EntityGraph(attributePaths = { "items", "delivery" })
    List<Order> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = { "items", "delivery" })
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    @EntityGraph(attributePaths = { "items", "delivery" })
    Optional<Order> findWithItemsById(Long id);

    @EntityGraph(attributePaths = { "items", "items.product", "items.variant", "delivery" })
    @Query("""
            select o
            from Order o
            where o.status = com.ecommercestore.backend.order.OrderStatus.RESERVED
              and o.expiresAt is not null
              and o.expiresAt <= :now
            """)
    List<Order> findExpiredReservations(@Param("now") Instant now);
}
