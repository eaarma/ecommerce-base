package com.ecommercestore.backend.payment.refund;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface RefundRepository extends JpaRepository<Refund, UUID> {

    List<Refund> findAllByOrderIdOrderByCreatedAtDesc(Long orderId);

    List<Refund> findAllByPaymentIdOrderByCreatedAtDesc(UUID paymentId);

    @Query("""
            select coalesce(sum(r.amount), 0)
            from Refund r
            where r.payment.id = :paymentId
              and r.status = com.ecommercestore.backend.payment.refund.RefundStatus.SUCCEEDED
            """)
    BigDecimal sumSucceededAmountByPaymentId(@Param("paymentId") UUID paymentId);

    @Query("""
            select coalesce(sum(r.quantity), 0)
            from Refund r
            where r.orderItem.id = :orderItemId
              and r.status = com.ecommercestore.backend.payment.refund.RefundStatus.SUCCEEDED
              and r.quantity is not null
            """)
    Integer sumSucceededQuantityByOrderItemId(@Param("orderItemId") Long orderItemId);
}
