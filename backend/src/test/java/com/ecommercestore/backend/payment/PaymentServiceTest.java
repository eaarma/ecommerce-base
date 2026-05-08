package com.ecommercestore.backend.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ecommercestore.backend.order.Order;
import com.ecommercestore.backend.order.OrderService;
import com.ecommercestore.backend.order.OrderStatus;
import com.ecommercestore.backend.payment.dto.PaymentResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentMapper paymentMapper;

    @Mock
    private OrderService orderService;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, paymentMapper, orderService);

        when(paymentMapper.toResponse(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            return new PaymentResponse(
                    payment.getId(),
                    payment.getOrder().getId(),
                    payment.getProvider(),
                    payment.getStatus(),
                    payment.getProviderPaymentIntentId(),
                    payment.getProviderChargeId(),
                    payment.getAmount(),
                    payment.getCurrency(),
                    payment.getFailureCode(),
                    payment.getFailureMessage(),
                    payment.getCreatedAt(),
                    payment.getUpdatedAt(),
                    payment.getPaidAt());
        });
    }

    @Test
    void markSucceededMarksPaidWhenOrderIsStillWithinWindow() {
        Payment payment = createPayment(
                OrderStatus.FINALIZED,
                Instant.now().plusSeconds(120),
                PaymentStatus.PENDING,
                "pi_active");

        when(paymentRepository.findByProviderPaymentIntentId("pi_active")).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.markSucceeded("pi_active", "ch_active");

        assertThat(response.status()).isEqualTo(PaymentStatus.SUCCEEDED);
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
        assertThat(payment.getProviderChargeId()).isEqualTo("ch_active");
        assertThat(payment.getPaidAt()).isNotNull();
        verify(orderService).markPaid(payment.getOrder().getId());
    }

    @Test
    void markSucceededRequiresReviewWhenOrderHoldHasExpired() {
        Payment payment = createPayment(
                OrderStatus.FINALIZED,
                Instant.now().minusSeconds(30),
                PaymentStatus.PENDING,
                "pi_late");

        when(paymentRepository.findByProviderPaymentIntentId("pi_late")).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.markSucceeded("pi_late", "ch_late");

        assertThat(response.status()).isEqualTo(PaymentStatus.SUCCEEDED_REQUIRES_REVIEW);
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED_REQUIRES_REVIEW);
        assertThat(payment.getFailureCode()).isEqualTo("payment_requires_review");
        assertThat(payment.getFailureMessage()).contains("requires manual review");
        assertThat(payment.getPaidAt()).isNotNull();
        verify(orderService, never()).markPaid(payment.getOrder().getId());
    }

    private Payment createPayment(
            OrderStatus orderStatus,
            Instant expiresAt,
            PaymentStatus paymentStatus,
            String providerPaymentIntentId) {
        Order order = Order.builder()
                .id(101L)
                .status(orderStatus)
                .expiresAt(expiresAt)
                .currency("EUR")
                .subtotal(new BigDecimal("39.90"))
                .shippingTotal(BigDecimal.ZERO)
                .total(new BigDecimal("39.90"))
                .customerEmail("customer@example.com")
                .customerFirstName("Test")
                .customerLastName("Customer")
                .build();

        return Payment.builder()
                .id(UUID.randomUUID())
                .order(order)
                .provider(PaymentProvider.STRIPE)
                .status(paymentStatus)
                .providerPaymentIntentId(providerPaymentIntentId)
                .amount(new BigDecimal("39.90"))
                .currency("EUR")
                .build();
    }
}
