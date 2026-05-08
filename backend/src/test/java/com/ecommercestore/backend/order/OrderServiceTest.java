package com.ecommercestore.backend.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.ecommercestore.backend.delivery.Delivery;
import com.ecommercestore.backend.delivery.DeliveryCarrier;
import com.ecommercestore.backend.delivery.DeliveryMethod;
import com.ecommercestore.backend.delivery.DeliveryStatus;
import com.ecommercestore.backend.delivery.dto.ReserveDeliveryRequest;
import com.ecommercestore.backend.email.OrderEmailRequestedEvent;
import com.ecommercestore.backend.order.dto.ReserveOrderItemRequest;
import com.ecommercestore.backend.order.dto.ReserveOrderRequest;
import com.ecommercestore.backend.product.Product;
import com.ecommercestore.backend.product.ProductMapper;
import com.ecommercestore.backend.product.ProductStatus;
import com.ecommercestore.backend.product.ProductVariant;
import com.ecommercestore.backend.product.ProductVariantRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    private static final String STALE_CART_MESSAGE = "Some items are no longer available. Please review your cart.";
    private static final long RESERVATION_HOLD_MINUTES = 15;
    private static final long FINALIZED_HOLD_MINUTES = 20;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository,
                productVariantRepository,
                new ProductMapper(),
                eventPublisher);
    }

    @Test
    void reserveOrderRejectsStaleCartWhenProductIsNotActive() {
        Product product = createProduct(11L, ProductStatus.ARCHIVED);
        ProductVariant variant = createVariant(21L, product, ProductStatus.ACTIVE, 5, "19.90");

        when(productVariantRepository.findAllByIdIn(Set.of(21L))).thenReturn(List.of(variant));

        assertThatThrownBy(() -> orderService.reserveOrder(createReserveOrderRequest(11L, 21L, "19.90")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(STALE_CART_MESSAGE);

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void reserveOrderRejectsStaleCartWhenPriceChanges() {
        Product product = createProduct(12L, ProductStatus.ACTIVE);
        ProductVariant variant = createVariant(22L, product, ProductStatus.ACTIVE, 5, "19.90");

        when(productVariantRepository.findAllByIdIn(Set.of(22L))).thenReturn(List.of(variant));

        assertThatThrownBy(() -> orderService.reserveOrder(createReserveOrderRequest(12L, 22L, "24.90")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(STALE_CART_MESSAGE);

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void reserveOrderRejectsParcelLockerDeliveryWithoutLockerDetails() {
        ReserveOrderRequest request = new ReserveOrderRequest(
                "customer@example.com",
                "Test",
                "Customer",
                new ReserveDeliveryRequest(
                        DeliveryMethod.PARCEL_LOCKER,
                        DeliveryCarrier.DPD,
                        "Test Customer",
                        "+37255555555",
                        "customer@example.com",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null),
                List.of(new ReserveOrderItemRequest(
                        11L,
                        21L,
                        1,
                        new BigDecimal("19.90"))));

        assertThatThrownBy(() -> orderService.reserveOrder(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Parcel locker ID is required.");

        verifyNoInteractions(productVariantRepository, orderRepository);
    }

    @Test
    void reserveOrderRejectsPostalDeliveryWithoutAddress() {
        ReserveOrderRequest request = new ReserveOrderRequest(
                "customer@example.com",
                "Test",
                "Customer",
                new ReserveDeliveryRequest(
                        DeliveryMethod.POSTAL_DELIVERY,
                        DeliveryCarrier.OTHER,
                        "Test Customer",
                        "+37255555555",
                        "customer@example.com",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null),
                List.of(new ReserveOrderItemRequest(
                        11L,
                        21L,
                        1,
                        new BigDecimal("19.90"))));

        assertThatThrownBy(() -> orderService.reserveOrder(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Address line 1 is required.");

        verifyNoInteractions(productVariantRepository, orderRepository);
    }

    @Test
    void finalizeOrderKeepsReservationExpiryButKeepsItemsReservedUntilPaymentSucceeds() {
        UUID token = UUID.randomUUID();
        Instant createdAt = Instant.now().minusSeconds(10 * 60);
        Product product = createProduct(13L, ProductStatus.ACTIVE);
        ProductVariant variant = createVariant(23L, product, ProductStatus.ACTIVE, 3, "29.90");
        Order order = createOrder(
                101L,
                token,
                OrderStatus.RESERVED,
                createdAt.plusSeconds(15 * 60),
                createdAt);
        order.addItem(createOrderItem(product, variant, 1, OrderItemStatus.RESERVED));

        when(orderRepository.findByIdAndReservationToken(101L, token)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order saved = orderService.finalizeOrder(101L, token);

        assertThat(saved.getStatus()).isEqualTo(OrderStatus.FINALIZED);
        assertThat(saved.getExpiresAt()).isEqualTo(createdAt.plusSeconds(RESERVATION_HOLD_MINUTES * 60));
        assertThat(saved.getFinalizedAt()).isNotNull();
        assertThat(saved.getItems()).extracting(OrderItem::getStatus)
                .containsExactly(OrderItemStatus.RESERVED);
    }

    @Test
    void beginPaymentSubmissionExtendsExpiryToWebhookGraceWindow() {
        UUID token = UUID.randomUUID();
        Instant createdAt = Instant.now().minusSeconds(10 * 60);
        Product product = createProduct(17L, ProductStatus.ACTIVE);
        ProductVariant variant = createVariant(27L, product, ProductStatus.ACTIVE, 2, "29.90");
        Order order = createOrder(
                105L,
                token,
                OrderStatus.FINALIZED,
                createdAt.plusSeconds(RESERVATION_HOLD_MINUTES * 60),
                createdAt);
        order.addItem(createOrderItem(product, variant, 1, OrderItemStatus.RESERVED));

        when(orderRepository.findByIdAndReservationToken(105L, token)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order saved = orderService.beginPaymentSubmission(105L, token);

        assertThat(saved.getStatus()).isEqualTo(OrderStatus.FINALIZED);
        assertThat(saved.getExpiresAt()).isEqualTo(createdAt.plusSeconds(FINALIZED_HOLD_MINUTES * 60));
    }

    @Test
    void beginPaymentSubmissionAfterReservationWindowExpiresOrder() {
        UUID token = UUID.randomUUID();
        Product product = createProduct(18L, ProductStatus.OUT_OF_STOCK);
        ProductVariant variant = createVariant(28L, product, ProductStatus.OUT_OF_STOCK, 0, "29.90");
        Order order = createOrder(
                106L,
                token,
                OrderStatus.FINALIZED,
                Instant.now().minusSeconds(5),
                Instant.now().minusSeconds(RESERVATION_HOLD_MINUTES * 60 + 5));
        order.addItem(createOrderItem(product, variant, 1, OrderItemStatus.RESERVED));

        when(orderRepository.findByIdAndReservationToken(106L, token)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.beginPaymentSubmission(106L, token))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Order reservation has expired.");

        assertThat(order.getStatus()).isEqualTo(OrderStatus.EXPIRED);
        assertThat(order.getItems()).extracting(OrderItem::getStatus)
                .containsExactly(OrderItemStatus.EXPIRED);
        assertThat(variant.getStockQuantity()).isEqualTo(1);
    }

    @Test
    void markPaidMovesReservedItemsToOrdered() {
        UUID token = UUID.randomUUID();
        Product product = createProduct(14L, ProductStatus.ACTIVE);
        ProductVariant variant = createVariant(24L, product, ProductStatus.ACTIVE, 2, "39.90");
        Order order = createOrder(102L, token, OrderStatus.FINALIZED, null, Instant.now());
        order.addItem(createOrderItem(product, variant, 1, OrderItemStatus.RESERVED));
        order.setDelivery(Delivery.builder()
                .method(DeliveryMethod.PARCEL_LOCKER)
                .status(DeliveryStatus.NOT_READY)
                .recipientName("Customer Example")
                .recipientEmail("customer@example.com")
                .carrier(DeliveryCarrier.DPD)
                .build());

        when(orderRepository.findById(102L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.markPaid(102L);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(order.getPaidAt()).isNotNull();
        assertThat(order.getExpiresAt()).isNull();
        assertThat(order.getItems()).extracting(OrderItem::getStatus)
                .containsExactly(OrderItemStatus.ORDERED);
        assertThat(order.getDelivery().getStatus()).isEqualTo(DeliveryStatus.READY_TO_SHIP);
        verify(eventPublisher).publishEvent(any(OrderEmailRequestedEvent.class));
    }

    @Test
    void cancelPaidItemWithoutRefundMarksSingleItemOrderAsCancelled() {
        UUID token = UUID.randomUUID();
        Product product = createProduct(30L, ProductStatus.ACTIVE);
        ProductVariant variant = createVariant(40L, product, ProductStatus.ACTIVE, 2, "39.90");
        Order order = createOrder(108L, token, OrderStatus.PAID, null, Instant.now());
        OrderItem item = createOrderItem(product, variant, 1, OrderItemStatus.ORDERED);
        item.setId(301L);
        order.addItem(item);
        order.setDelivery(Delivery.builder()
                .method(DeliveryMethod.PARCEL_LOCKER)
                .status(DeliveryStatus.READY_TO_SHIP)
                .recipientName("Customer Example")
                .recipientEmail("customer@example.com")
                .carrier(DeliveryCarrier.DPD)
                .trackingNumber("TRACK-1")
                .trackingUrl("https://tracking.example/1")
                .build());

        when(orderRepository.findWithItemsById(108L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order saved = orderService.cancelPaidItemWithoutRefund(108L, item.getId());

        assertThat(saved.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(saved.getItems()).extracting(OrderItem::getStatus)
                .containsExactly(OrderItemStatus.CANCELLED_NO_REFUND);
        assertThat(saved.getDelivery().getStatus()).isEqualTo(DeliveryStatus.CANCELLED);
        assertThat(saved.getDelivery().getTrackingNumber()).isNull();
        assertThat(saved.getDelivery().getTrackingUrl()).isNull();
    }

    @Test
    void cancelPaidItemWithoutRefundKeepsMultiItemOrderPaidUntilAllItemsAreCancelled() {
        UUID token = UUID.randomUUID();
        Product product = createProduct(31L, ProductStatus.ACTIVE);
        ProductVariant firstVariant = createVariant(41L, product, ProductStatus.ACTIVE, 2, "39.90");
        ProductVariant secondVariant = createVariant(42L, product, ProductStatus.ACTIVE, 2, "29.90");
        Order order = createOrder(109L, token, OrderStatus.PAID, null, Instant.now());
        OrderItem firstItem = createOrderItem(product, firstVariant, 1, OrderItemStatus.ORDERED);
        OrderItem secondItem = createOrderItem(product, secondVariant, 1, OrderItemStatus.ORDERED);
        firstItem.setId(302L);
        secondItem.setId(303L);
        order.addItem(firstItem);
        order.addItem(secondItem);

        when(orderRepository.findWithItemsById(109L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order saved = orderService.cancelPaidItemWithoutRefund(109L, firstItem.getId());

        assertThat(saved.getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(firstItem.getStatus()).isEqualTo(OrderItemStatus.CANCELLED_NO_REFUND);
        assertThat(secondItem.getStatus()).isEqualTo(OrderItemStatus.ORDERED);
    }

    @Test
    void getOrderByTokenExpiresReservationAndRestocksOnlyOnce() {
        UUID token = UUID.randomUUID();
        Product product = createProduct(15L, ProductStatus.OUT_OF_STOCK);
        ProductVariant variant = createVariant(25L, product, ProductStatus.OUT_OF_STOCK, 0, "49.90");
        Order order = createOrder(103L, token, OrderStatus.RESERVED, Instant.now().minusSeconds(60), Instant.now());
        order.addItem(createOrderItem(product, variant, 1, OrderItemStatus.RESERVED));

        when(orderRepository.findByIdAndReservationToken(103L, token)).thenReturn(Optional.of(order));

        orderService.getOrderByToken(103L, token);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.EXPIRED);
        assertThat(order.getItems()).extracting(OrderItem::getStatus)
                .containsExactly(OrderItemStatus.EXPIRED);
        assertThat(variant.getStockQuantity()).isEqualTo(1);
        assertThat(variant.getStatus()).isEqualTo(ProductStatus.ACTIVE);
        assertThat(product.getStatus()).isEqualTo(ProductStatus.ACTIVE);

        orderService.getOrderByToken(103L, token);

        assertThat(variant.getStockQuantity()).isEqualTo(1);
    }

    @Test
    void getOrderByTokenExpiresFinalizedOrdersAfterGraceWindow() {
        UUID token = UUID.randomUUID();
        Product product = createProduct(16L, ProductStatus.OUT_OF_STOCK);
        ProductVariant variant = createVariant(26L, product, ProductStatus.OUT_OF_STOCK, 0, "59.90");
        Order order = createOrder(
                104L,
                token,
                OrderStatus.FINALIZED,
                Instant.now().minusSeconds(60),
                Instant.now().minusSeconds(FINALIZED_HOLD_MINUTES * 60));
        order.addItem(createOrderItem(product, variant, 1, OrderItemStatus.RESERVED));

        when(orderRepository.findByIdAndReservationToken(104L, token)).thenReturn(Optional.of(order));

        orderService.getOrderByToken(104L, token);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.EXPIRED);
        assertThat(order.getItems()).extracting(OrderItem::getStatus)
                .containsExactly(OrderItemStatus.EXPIRED);
        assertThat(variant.getStockQuantity()).isEqualTo(1);
    }

    @Test
    void markPaymentFailedAfterReservationWindowExpiresOrder() {
        UUID token = UUID.randomUUID();
        Product product = createProduct(19L, ProductStatus.OUT_OF_STOCK);
        ProductVariant variant = createVariant(29L, product, ProductStatus.OUT_OF_STOCK, 0, "19.90");
        Order order = createOrder(
                107L,
                token,
                OrderStatus.FINALIZED,
                Instant.now().plusSeconds(5 * 60),
                Instant.now().minusSeconds(RESERVATION_HOLD_MINUTES * 60 + 5));
        order.addItem(createOrderItem(product, variant, 1, OrderItemStatus.RESERVED));

        when(orderRepository.findById(107L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.markPaymentFailed(107L);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.EXPIRED);
        assertThat(order.getItems()).extracting(OrderItem::getStatus)
                .containsExactly(OrderItemStatus.EXPIRED);
        assertThat(variant.getStockQuantity()).isEqualTo(1);
    }

    private ReserveOrderRequest createReserveOrderRequest(
            Long productId,
            Long variantId,
            String expectedUnitPrice) {
        return new ReserveOrderRequest(
                "customer@example.com",
                "Test",
                "Customer",
                new ReserveDeliveryRequest(
                        DeliveryMethod.PARCEL_LOCKER,
                        DeliveryCarrier.DPD,
                        "Test Customer",
                        "+37255555555",
                        "customer@example.com",
                        "locker-1",
                        "Locker 1",
                        "Main street 1",
                        null,
                        null,
                        null,
                        null,
                        null),
                List.of(new ReserveOrderItemRequest(
                        productId,
                        variantId,
                        1,
                        new BigDecimal(expectedUnitPrice))));
    }

    private Product createProduct(Long id, ProductStatus status) {
        return Product.builder()
                .id(id)
                .name("Test Product")
                .slug("test-product-" + id)
                .description("Product for tests")
                .basePrice(new BigDecimal("19.90"))
                .status(status)
                .variants(new ArrayList<>())
                .images(new ArrayList<>())
                .build();
    }

    private ProductVariant createVariant(
            Long id,
            Product product,
            ProductStatus status,
            int stockQuantity,
            String price) {
        ProductVariant variant = ProductVariant.builder()
                .id(id)
                .product(product)
                .sku("SKU-" + id)
                .price(new BigDecimal(price))
                .stockQuantity(stockQuantity)
                .status(status)
                .build();
        product.addVariant(variant);
        return variant;
    }

    private Order createOrder(
            Long id,
            UUID token,
            OrderStatus status,
            Instant expiresAt,
            Instant createdAt) {
        return Order.builder()
                .id(id)
                .reservationToken(token)
                .expiresAt(expiresAt)
                .status(status)
                .customerEmail("customer@example.com")
                .customerFirstName("Test")
                .customerLastName("Customer")
                .subtotal(new BigDecimal("19.90"))
                .shippingTotal(BigDecimal.ZERO)
                .total(new BigDecimal("19.90"))
                .currency("EUR")
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .items(new ArrayList<>())
                .build();
    }

    private OrderItem createOrderItem(
            Product product,
            ProductVariant variant,
            int quantity,
            OrderItemStatus status) {
        return OrderItem.builder()
                .product(product)
                .variant(variant)
                .productSnapshotId(product.getId())
                .productSnapshotName(product.getName())
                .variantSnapshotId(variant.getId())
                .variantSnapshotSku(variant.getSku())
                .variantSnapshotLabel("Default")
                .unitPrice(variant.getPrice())
                .quantity(quantity)
                .lineTotal(variant.getPrice().multiply(BigDecimal.valueOf(quantity)))
                .status(status)
                .build();
    }
}
