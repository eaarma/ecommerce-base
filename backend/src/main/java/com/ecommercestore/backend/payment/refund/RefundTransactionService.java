package com.ecommercestore.backend.payment.refund;

import com.ecommercestore.backend.email.OrderEmailRequestedEvent;
import com.ecommercestore.backend.email.OrderEmailType;
import com.ecommercestore.backend.delivery.Delivery;
import com.ecommercestore.backend.delivery.DeliveryStatus;
import com.ecommercestore.backend.order.Order;
import com.ecommercestore.backend.order.OrderItem;
import com.ecommercestore.backend.order.OrderItemStatus;
import com.ecommercestore.backend.order.OrderRepository;
import com.ecommercestore.backend.order.OrderStatus;
import com.ecommercestore.backend.payment.Payment;
import com.ecommercestore.backend.payment.PaymentRepository;
import com.ecommercestore.backend.payment.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RefundTransactionService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Refund createOrReuseRefundIntent(
            UUID paymentId,
            Long orderId,
            Long orderItemId,
            Integer quantity,
            BigDecimal amount,
            String currency,
            String reason) {
        Refund existingRefund = findPendingRefundIntent(paymentId, orderItemId, quantity, amount);

        if (existingRefund != null) {
            return existingRefund;
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));
        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));

        OrderItem item = null;

        if (orderItemId != null) {
            item = order.getItems()
                    .stream()
                    .filter(orderItem -> orderItem.getId().equals(orderItemId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Order item not found."));
        }

        return refundRepository.save(Refund.builder()
                .payment(payment)
                .order(order)
                .orderItem(item)
                .quantity(quantity)
                .amount(amount)
                .currency(currency)
                .reason(reason)
                .status(RefundStatus.PENDING)
                .build());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = IllegalStateException.class)
    public Refund finalizeRefundFromStripe(UUID refundId, com.stripe.model.Refund stripeRefund) {
        Refund refund = refundRepository.findWithOrderDetailsById(refundId)
                .orElseThrow(() -> new IllegalArgumentException("Refund not found."));

        refund.setStripeRefundId(stripeRefund.getId());

        if ("failed".equals(stripeRefund.getStatus())) {
            refund.setStatus(RefundStatus.FAILED);
            throw new IllegalStateException("Stripe refund failed.");
        }

        if (!"succeeded".equals(stripeRefund.getStatus())) {
            refund.setStatus(RefundStatus.PENDING);
            return refund;
        }

        if (refund.getStatus() == RefundStatus.SUCCEEDED) {
            return refund;
        }

        refund.setStatus(RefundStatus.SUCCEEDED);
        refund.setSucceededAt(Instant.now());

        if (refund.getOrderItem() == null) {
            applyFullOrderRefund(refund);
        } else {
            applyItemRefund(refund);
        }

        return refund;
    }

    private Refund findPendingRefundIntent(
            UUID paymentId,
            Long orderItemId,
            Integer quantity,
            BigDecimal amount) {
        if (orderItemId == null) {
            return refundRepository
                    .findFirstByPaymentIdAndOrderItemIsNullAndAmountAndStatusOrderByCreatedAtDesc(
                            paymentId,
                            amount,
                            RefundStatus.PENDING)
                    .orElse(null);
        }

        return refundRepository
                .findFirstByPaymentIdAndOrderItemIdAndQuantityAndAmountAndStatusOrderByCreatedAtDesc(
                        paymentId,
                        orderItemId,
                        quantity,
                        amount,
                        RefundStatus.PENDING)
                .orElse(null);
    }

    private void applyFullOrderRefund(Refund refund) {
        Order order = refund.getOrder();

        order.getItems().forEach(item -> item.setStatus(OrderItemStatus.REFUNDED));
        order.setStatus(OrderStatus.CANCELLED_REFUNDED);
        cancelDeliveryIfUnshipped(order);

        updatePaymentStatus(refund.getPayment());
        eventPublisher.publishEvent(new OrderEmailRequestedEvent(
                order.getId(),
                OrderEmailType.CANCELLATION,
                refund.getReason(),
                null));
    }

    private void applyItemRefund(Refund refund) {
        OrderItem item = refund.getOrderItem();
        int refundedQuantity = refundRepository.sumSucceededQuantityByOrderItemId(item.getId());

        item.setStatus(refundedQuantity >= item.getQuantity()
                ? OrderItemStatus.REFUNDED
                : OrderItemStatus.PARTIALLY_REFUNDED);

        updateOrderStatus(refund.getOrder());
        if (refund.getOrder().getStatus() == OrderStatus.REFUNDED) {
            cancelDeliveryIfUnshipped(refund.getOrder());
        }
        updatePaymentStatus(refund.getPayment());
        eventPublisher.publishEvent(new OrderEmailRequestedEvent(
                refund.getOrder().getId(),
                OrderEmailType.ITEM_REFUND,
                refund.getReason(),
                refund.getId()));
    }

    private void updateOrderStatus(Order order) {
        boolean allRefunded = order.getItems()
                .stream()
                .allMatch(item -> item.getStatus() == OrderItemStatus.REFUNDED);

        order.setStatus(allRefunded ? OrderStatus.REFUNDED : OrderStatus.PARTIALLY_REFUNDED);
    }

    private void updatePaymentStatus(Payment payment) {
        BigDecimal refundedAmount = refundRepository.sumSucceededAmountByPaymentId(payment.getId());
        payment.setStatus(refundedAmount.compareTo(payment.getAmount()) >= 0
                ? PaymentStatus.REFUNDED
                : PaymentStatus.PARTIALLY_REFUNDED);
    }

    private void cancelDeliveryIfUnshipped(Order order) {
        Delivery delivery = order.getDelivery();

        if (delivery == null) {
            return;
        }

        if (delivery.getStatus() == DeliveryStatus.SHIPPED
                || delivery.getStatus() == DeliveryStatus.SENT_BACK
                || delivery.getStatus() == DeliveryStatus.DELIVERED) {
            return;
        }

        delivery.setStatus(DeliveryStatus.CANCELLED);
        delivery.setTrackingNumber(null);
        delivery.setTrackingUrl(null);
        delivery.setShippedAt(null);
        delivery.setDeliveredAt(null);
    }
}
