package com.ecommercestore.backend.payment.refund;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.ecommercestore.backend.order.Order;
import com.ecommercestore.backend.order.OrderItem;
import com.ecommercestore.backend.order.OrderItemStatus;
import com.ecommercestore.backend.order.OrderRepository;
import com.ecommercestore.backend.order.OrderStatus;
import com.ecommercestore.backend.payment.PaymentRepository;
import com.ecommercestore.backend.payment.stripe.StripeService;
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
class RefundServiceTest {

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private RefundMapper refundMapper;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private StripeService stripeService;

    @Mock
    private RefundTransactionService refundTransactionService;

    private RefundService refundService;

    @BeforeEach
    void setUp() {
        refundService = new RefundService(
                refundRepository,
                refundMapper,
                orderRepository,
                paymentRepository,
                stripeService,
                refundTransactionService);
    }

    @Test
    void refundItemRejectsNonRefundableItemState() {
        Order order = createOrder(OrderStatus.PAID);
        order.addItem(createOrderItem(201L, OrderItemStatus.CANCELLED_NO_REFUND, 1, "19.90"));

        when(orderRepository.findWithItemsById(101L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> refundService.refundItem(101L, 201L, 1, "Damaged by customer"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Only ordered or partially refunded items can be refunded.");
    }

    @Test
    void refundOrderRejectsOrdersContainingNonRefundableItems() {
        Order order = createOrder(OrderStatus.PAID);
        order.addItem(createOrderItem(202L, OrderItemStatus.ORDERED, 1, "19.90"));
        order.addItem(createOrderItem(203L, OrderItemStatus.CANCELLED_NO_REFUND, 1, "19.90"));

        when(orderRepository.findWithItemsById(101L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> refundService.refundOrder(101L, "Requested full refund"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Order contains items that cannot be refunded.");
    }

    private Order createOrder(OrderStatus status) {
        return Order.builder()
                .id(101L)
                .status(status)
                .customerEmail("customer@example.com")
                .customerFirstName("Test")
                .customerLastName("Customer")
                .currency("EUR")
                .subtotal(new BigDecimal("39.80"))
                .shippingTotal(BigDecimal.ZERO)
                .total(new BigDecimal("39.80"))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .items(new ArrayList<>())
                .build();
    }

    private OrderItem createOrderItem(Long id, OrderItemStatus status, int quantity, String unitPrice) {
        BigDecimal price = new BigDecimal(unitPrice);
        return OrderItem.builder()
                .id(id)
                .productSnapshotId(501L)
                .productSnapshotName("Refund Test Item")
                .variantSnapshotId(601L)
                .variantSnapshotSku("SKU-" + id)
                .variantSnapshotLabel("Default")
                .unitPrice(price)
                .quantity(quantity)
                .lineTotal(price.multiply(BigDecimal.valueOf(quantity)))
                .status(status)
                .build();
    }
}
