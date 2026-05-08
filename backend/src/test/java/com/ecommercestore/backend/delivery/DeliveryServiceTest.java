package com.ecommercestore.backend.delivery;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ecommercestore.backend.delivery.dto.UpdateDeliveryRequest;
import com.ecommercestore.backend.order.Order;
import com.ecommercestore.backend.order.OrderRepository;
import com.ecommercestore.backend.order.OrderStatus;
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

@ExtendWith(MockitoExtension.class)
class DeliveryServiceTest {

    @Mock
    private OrderRepository orderRepository;

    private DeliveryService deliveryService;

    @BeforeEach
    void setUp() {
        deliveryService = new DeliveryService(orderRepository);
    }

    @Test
    void updateManagerDeliveryRejectsReadyToShipBeforePayment() {
        Order order = createOrder(OrderStatus.RESERVED, DeliveryStatus.NOT_READY);

        when(orderRepository.findWithItemsById(101L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> deliveryService.updateManagerDelivery(
                101L,
                new UpdateDeliveryRequest(DeliveryStatus.READY_TO_SHIP, null, null, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Only paid, partially refunded, or closed paid orders can be marked ready to ship.");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void updateManagerDeliveryAllowsShippingCancelledOrderToCorrectStaleFulfillmentState() {
        Order order = createOrder(OrderStatus.CANCELLED, DeliveryStatus.CANCELLED);

        when(orderRepository.findWithItemsById(101L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order saved = deliveryService.updateManagerDelivery(
                101L,
                new UpdateDeliveryRequest(
                        DeliveryStatus.SHIPPED,
                        DeliveryCarrier.DPD,
                        "TRACK-2",
                        "https://tracking.example/2"));

        assertThat(saved.getDelivery().getStatus()).isEqualTo(DeliveryStatus.SHIPPED);
        assertThat(saved.getDelivery().getTrackingNumber()).isEqualTo("TRACK-2");
        assertThat(saved.getDelivery().getTrackingUrl()).isEqualTo("https://tracking.example/2");
        assertThat(saved.getDelivery().getShippedAt()).isNotNull();
    }

    @Test
    void updateManagerDeliveryAllowsSentBackForClosedPaidOrder() {
        Order order = createOrder(OrderStatus.REFUNDED, DeliveryStatus.READY_TO_SHIP);

        when(orderRepository.findWithItemsById(101L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order saved = deliveryService.updateManagerDelivery(
                101L,
                new UpdateDeliveryRequest(DeliveryStatus.SENT_BACK, null, null, null));

        assertThat(saved.getDelivery().getStatus()).isEqualTo(DeliveryStatus.SENT_BACK);
        assertThat(saved.getDelivery().getShippedAt()).isNotNull();
    }

    @Test
    void updateManagerDeliveryRejectsTrackingUpdateOnCancelledDelivery() {
        Order order = createOrder(OrderStatus.CANCELLED, DeliveryStatus.CANCELLED);

        when(orderRepository.findWithItemsById(101L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> deliveryService.updateManagerDelivery(
                101L,
                new UpdateDeliveryRequest(null, null, "TRACK-1", null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Tracking cannot be updated for cancelled delivery.");
    }

    @Test
    void updateManagerDeliveryAllowsNoOpTrackingPayloadForCancelledDelivery() {
        Order order = createOrder(OrderStatus.CANCELLED, DeliveryStatus.CANCELLED);

        when(orderRepository.findWithItemsById(101L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order saved = deliveryService.updateManagerDelivery(
                101L,
                new UpdateDeliveryRequest(DeliveryStatus.CANCELLED, null, "", ""));

        assertThat(saved.getDelivery().getStatus()).isEqualTo(DeliveryStatus.CANCELLED);
        assertThat(saved.getDelivery().getTrackingNumber()).isNull();
        assertThat(saved.getDelivery().getTrackingUrl()).isNull();
    }

    @Test
    void updateManagerDeliveryAllowsTrackingWhenMovingAwayFromCancelledDelivery() {
        Order order = createOrder(OrderStatus.CANCELLED, DeliveryStatus.CANCELLED);

        when(orderRepository.findWithItemsById(101L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order saved = deliveryService.updateManagerDelivery(
                101L,
                new UpdateDeliveryRequest(DeliveryStatus.READY_TO_SHIP, null, "TRACK-3", null));

        assertThat(saved.getDelivery().getStatus()).isEqualTo(DeliveryStatus.READY_TO_SHIP);
        assertThat(saved.getDelivery().getTrackingNumber()).isEqualTo("TRACK-3");
    }

    @Test
    void updateManagerDeliveryShipsPaidReadyOrder() {
        Order order = createOrder(OrderStatus.PAID, DeliveryStatus.READY_TO_SHIP);

        when(orderRepository.findWithItemsById(101L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order saved = deliveryService.updateManagerDelivery(
                101L,
                new UpdateDeliveryRequest(
                        DeliveryStatus.SHIPPED,
                        DeliveryCarrier.DPD,
                        "TRACK-1",
                        "https://tracking.example/1"));

        assertThat(saved.getDelivery().getStatus()).isEqualTo(DeliveryStatus.SHIPPED);
        assertThat(saved.getDelivery().getTrackingNumber()).isEqualTo("TRACK-1");
        assertThat(saved.getDelivery().getTrackingUrl()).isEqualTo("https://tracking.example/1");
        assertThat(saved.getDelivery().getShippedAt()).isNotNull();
    }

    private Order createOrder(OrderStatus status, DeliveryStatus deliveryStatus) {
        Order order = Order.builder()
                .id(101L)
                .reservationToken(UUID.randomUUID())
                .status(status)
                .customerEmail("customer@example.com")
                .customerFirstName("Test")
                .customerLastName("Customer")
                .subtotal(new BigDecimal("19.90"))
                .shippingTotal(BigDecimal.ZERO)
                .total(new BigDecimal("19.90"))
                .currency("EUR")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .items(new ArrayList<>())
                .build();

        order.setDelivery(Delivery.builder()
                .method(DeliveryMethod.PARCEL_LOCKER)
                .status(deliveryStatus)
                .recipientName("Customer Example")
                .recipientEmail("customer@example.com")
                .carrier(DeliveryCarrier.DPD)
                .build());

        return order;
    }
}
