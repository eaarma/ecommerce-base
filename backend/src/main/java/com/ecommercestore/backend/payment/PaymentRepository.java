package com.ecommercestore.backend.payment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByProviderPaymentIntentId(String providerPaymentIntentId);

    Optional<Payment> findFirstByOrderIdAndStatusOrderByCreatedAtDesc(
            Long orderId,
            PaymentStatus status);

    Optional<Payment> findFirstByOrderIdAndStatusInOrderByCreatedAtDesc(
            Long orderId,
            List<PaymentStatus> statuses);

    List<Payment> findAllByOrderByCreatedAtDesc();

    List<Payment> findAllByOrderIdOrderByCreatedAtDesc(Long orderId);
}
