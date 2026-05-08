package com.ecommercestore.backend.payment.refund;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ecommercestore.backend.delivery.Delivery;
import com.ecommercestore.backend.delivery.DeliveryCarrier;
import com.ecommercestore.backend.delivery.DeliveryMethod;
import com.ecommercestore.backend.delivery.DeliveryStatus;
import com.ecommercestore.backend.email.OrderEmailRequestedEvent;
import com.ecommercestore.backend.order.Order;
import com.ecommercestore.backend.order.OrderItem;
import com.ecommercestore.backend.order.OrderItemStatus;
import com.ecommercestore.backend.order.OrderRepository;
import com.ecommercestore.backend.order.OrderStatus;
import com.ecommercestore.backend.payment.Payment;
import com.ecommercestore.backend.payment.PaymentProvider;
import com.ecommercestore.backend.payment.PaymentRepository;
import com.ecommercestore.backend.payment.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
class RefundTransactionServiceTest {

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private RefundTransactionService refundTransactionService;

    @BeforeEach
    void setUp() {
        refundTransactionService = new RefundTransactionService(
                refundRepository,
                paymentRepository,
                orderRepository,
                eventPublisher);
    }

    @Test
    void createOrReuseRefundIntentReturnsExistingPendingItemRefund() {
        UUID paymentId = UUID.randomUUID();
        Refund existingRefund = Refund.builder()
                .id(UUID.randomUUID())
                .amount(new BigDecimal("19.90"))
                .currency("EUR")
                .quantity(1)
                .status(RefundStatus.PENDING)
                .build();

        when(refundRepository.findFirstByPaymentIdAndOrderItemIdAndQuantityAndAmountAndStatusOrderByCreatedAtDesc(
                paymentId,
                201L,
                1,
                new BigDecimal("19.90"),
                RefundStatus.PENDING)).thenReturn(Optional.of(existingRefund));

        Refund refund = refundTransactionService.createOrReuseRefundIntent(
                paymentId,
                101L,
                201L,
                1,
                new BigDecimal("19.90"),
                "EUR",
                "Requested refund");

        assertThat(refund).isSameAs(existingRefund);
        verify(paymentRepository, never()).findById(any());
        verify(refundRepository, never()).save(any(Refund.class));
    }

    @Test
    void finalizeRefundFromStripeMarksSucceededAndAppliesItemSideEffects() {
        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .provider(PaymentProvider.STRIPE)
                .status(PaymentStatus.SUCCEEDED)
                .amount(new BigDecimal("39.80"))
                .currency("EUR")
                .build();
        Order order = Order.builder()
                .id(101L)
                .status(OrderStatus.PAID)
                .customerEmail("customer@example.com")
                .customerFirstName("Test")
                .customerLastName("Customer")
                .subtotal(new BigDecimal("39.80"))
                .shippingTotal(BigDecimal.ZERO)
                .total(new BigDecimal("39.80"))
                .currency("EUR")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .items(new ArrayList<>())
                .build();
        OrderItem item = OrderItem.builder()
                .id(201L)
                .productSnapshotId(301L)
                .productSnapshotName("Refundable Item")
                .variantSnapshotId(401L)
                .variantSnapshotSku("SKU-201")
                .variantSnapshotLabel("Default")
                .unitPrice(new BigDecimal("19.90"))
                .quantity(2)
                .lineTotal(new BigDecimal("39.80"))
                .status(OrderItemStatus.ORDERED)
                .build();
        order.addItem(item);

        Refund refund = Refund.builder()
                .id(UUID.randomUUID())
                .payment(payment)
                .order(order)
                .orderItem(item)
                .quantity(1)
                .amount(new BigDecimal("19.90"))
                .currency("EUR")
                .reason("Partial refund")
                .status(RefundStatus.PENDING)
                .build();

        com.stripe.model.Refund stripeRefund = org.mockito.Mockito.mock(com.stripe.model.Refund.class);

        when(refundRepository.findWithOrderDetailsById(refund.getId())).thenReturn(Optional.of(refund));
        when(refundRepository.sumSucceededQuantityByOrderItemId(item.getId())).thenReturn(1);
        when(refundRepository.sumSucceededAmountByPaymentId(payment.getId())).thenReturn(new BigDecimal("19.90"));
        when(stripeRefund.getId()).thenReturn("re_123");
        when(stripeRefund.getStatus()).thenReturn("succeeded");

        Refund finalizedRefund = refundTransactionService.finalizeRefundFromStripe(refund.getId(), stripeRefund);

        assertThat(finalizedRefund.getStatus()).isEqualTo(RefundStatus.SUCCEEDED);
        assertThat(item.getStatus()).isEqualTo(OrderItemStatus.PARTIALLY_REFUNDED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PARTIALLY_REFUNDED);
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PARTIALLY_REFUNDED);
        verify(eventPublisher).publishEvent(any(OrderEmailRequestedEvent.class));
    }

    @Test
    void finalizeRefundFromStripeCancelsUnshippedDeliveryForFullRefund() {
        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .provider(PaymentProvider.STRIPE)
                .status(PaymentStatus.SUCCEEDED)
                .amount(new BigDecimal("39.80"))
                .currency("EUR")
                .build();
        Order order = Order.builder()
                .id(101L)
                .status(OrderStatus.PAID)
                .customerEmail("customer@example.com")
                .customerFirstName("Test")
                .customerLastName("Customer")
                .subtotal(new BigDecimal("39.80"))
                .shippingTotal(BigDecimal.ZERO)
                .total(new BigDecimal("39.80"))
                .currency("EUR")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .items(new ArrayList<>())
                .build();
        order.setDelivery(Delivery.builder()
                .method(DeliveryMethod.PARCEL_LOCKER)
                .status(DeliveryStatus.READY_TO_SHIP)
                .recipientName("Customer Example")
                .recipientEmail("customer@example.com")
                .carrier(DeliveryCarrier.DPD)
                .trackingNumber("TRACK-1")
                .trackingUrl("https://tracking.example/1")
                .build());
        OrderItem item = OrderItem.builder()
                .id(201L)
                .productSnapshotId(301L)
                .productSnapshotName("Refundable Item")
                .variantSnapshotId(401L)
                .variantSnapshotSku("SKU-201")
                .variantSnapshotLabel("Default")
                .unitPrice(new BigDecimal("19.90"))
                .quantity(2)
                .lineTotal(new BigDecimal("39.80"))
                .status(OrderItemStatus.ORDERED)
                .build();
        order.addItem(item);

        Refund refund = Refund.builder()
                .id(UUID.randomUUID())
                .payment(payment)
                .order(order)
                .amount(new BigDecimal("39.80"))
                .currency("EUR")
                .reason("Full refund")
                .status(RefundStatus.PENDING)
                .build();

        com.stripe.model.Refund stripeRefund = org.mockito.Mockito.mock(com.stripe.model.Refund.class);

        when(refundRepository.findWithOrderDetailsById(refund.getId())).thenReturn(Optional.of(refund));
        when(refundRepository.sumSucceededAmountByPaymentId(payment.getId())).thenReturn(new BigDecimal("39.80"));
        when(stripeRefund.getId()).thenReturn("re_456");
        when(stripeRefund.getStatus()).thenReturn("succeeded");

        Refund finalizedRefund = refundTransactionService.finalizeRefundFromStripe(refund.getId(), stripeRefund);

        assertThat(finalizedRefund.getStatus()).isEqualTo(RefundStatus.SUCCEEDED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED_REFUNDED);
        assertThat(order.getDelivery().getStatus()).isEqualTo(DeliveryStatus.CANCELLED);
        assertThat(order.getDelivery().getTrackingNumber()).isNull();
        assertThat(order.getDelivery().getTrackingUrl()).isNull();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
    }
}
