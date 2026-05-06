package com.ecommercestore.backend.payment.refund;

import com.ecommercestore.backend.email.OrderEmailRequestedEvent;
import com.ecommercestore.backend.email.OrderEmailType;
import com.ecommercestore.backend.order.Order;
import com.ecommercestore.backend.order.OrderItem;
import com.ecommercestore.backend.order.OrderItemStatus;
import com.ecommercestore.backend.order.OrderRepository;
import com.ecommercestore.backend.order.OrderStatus;
import com.ecommercestore.backend.payment.Payment;
import com.ecommercestore.backend.payment.PaymentRepository;
import com.ecommercestore.backend.payment.PaymentStatus;
import com.ecommercestore.backend.payment.refund.dto.RefundResponse;
import com.ecommercestore.backend.payment.stripe.StripeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefundService {

    private static final List<PaymentStatus> REFUNDABLE_PAYMENT_STATUSES = List.of(
            PaymentStatus.SUCCEEDED,
            PaymentStatus.PARTIALLY_REFUNDED);

    private final RefundRepository refundRepository;
    private final RefundMapper refundMapper;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final StripeService stripeService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public RefundResponse refundOrder(Long orderId, String reason) {
        Order order = getRefundableOrder(orderId);
        Payment payment = getRefundablePayment(orderId);
        BigDecimal alreadyRefunded = refundRepository.sumSucceededAmountByPaymentId(payment.getId());
        BigDecimal amount = payment.getAmount().subtract(alreadyRefunded);

        if (amount.signum() <= 0) {
            throw new IllegalStateException("Order has already been fully refunded.");
        }

        Refund refund = createRefundRecord(payment, order, null, null, amount, reason);
        markRefundSucceeded(refund, createStripeRefund(payment, refund));

        if (refund.getStatus() == RefundStatus.SUCCEEDED) {
            order.getItems().forEach(item -> item.setStatus(OrderItemStatus.REFUNDED));
            order.setStatus(OrderStatus.CANCELLED_REFUNDED);
            updatePaymentStatus(payment);
            eventPublisher.publishEvent(new OrderEmailRequestedEvent(order.getId(), OrderEmailType.CANCELLATION, reason, null));
        }

        return refundMapper.toResponse(refund);
    }

    @Transactional
    public RefundResponse refundItem(Long orderId, Long orderItemId, Integer quantity, String reason) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Refund quantity must be greater than zero.");
        }

        Order order = getRefundableOrder(orderId);
        OrderItem item = order.getItems()
                .stream()
                .filter(orderItem -> orderItem.getId().equals(orderItemId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Order item not found."));

        int alreadyRefunded = refundRepository.sumSucceededQuantityByOrderItemId(orderItemId);
        int remainingQuantity = item.getQuantity() - alreadyRefunded;

        if (quantity > remainingQuantity) {
            throw new IllegalStateException("Refund quantity exceeds the remaining refundable quantity.");
        }

        Payment payment = getRefundablePayment(orderId);
        BigDecimal amount = item.getUnitPrice().multiply(BigDecimal.valueOf(quantity));
        BigDecimal remainingPaymentAmount = payment.getAmount()
                .subtract(refundRepository.sumSucceededAmountByPaymentId(payment.getId()));

        if (amount.compareTo(remainingPaymentAmount) > 0) {
            throw new IllegalStateException("Refund amount exceeds the remaining refundable payment amount.");
        }

        Refund refund = createRefundRecord(payment, order, item, quantity, amount, reason);
        markRefundSucceeded(refund, createStripeRefund(payment, refund));

        if (refund.getStatus() != RefundStatus.SUCCEEDED) {
            return refundMapper.toResponse(refund);
        }

        int totalRefundedQuantity = alreadyRefunded + quantity;
        item.setStatus(totalRefundedQuantity == item.getQuantity()
                ? OrderItemStatus.REFUNDED
                : OrderItemStatus.PARTIALLY_REFUNDED);
        updateOrderStatus(order);
        updatePaymentStatus(payment);
        eventPublisher.publishEvent(new OrderEmailRequestedEvent(order.getId(), OrderEmailType.ITEM_REFUND, reason, refund.getId()));

        return refundMapper.toResponse(refund);
    }

    @Transactional(readOnly = true)
    public List<RefundResponse> getRefundsForOrder(Long orderId) {
        return refundRepository.findAllByOrderIdOrderByCreatedAtDesc(orderId)
                .stream()
                .map(refundMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RefundResponse> getRefundsForPayment(UUID paymentId) {
        return refundRepository.findAllByPaymentIdOrderByCreatedAtDesc(paymentId)
                .stream()
                .map(refundMapper::toResponse)
                .toList();
    }

    private Order getRefundableOrder(Long orderId) {
        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));

        if (order.getStatus() != OrderStatus.PAID
                && order.getStatus() != OrderStatus.PARTIALLY_REFUNDED) {
            throw new IllegalStateException("Only paid or partially refunded orders can be refunded.");
        }

        return order;
    }

    private Payment getRefundablePayment(Long orderId) {
        Payment payment = paymentRepository
                .findFirstByOrderIdAndStatusInOrderByCreatedAtDesc(orderId, REFUNDABLE_PAYMENT_STATUSES)
                .orElseThrow(() -> new IllegalStateException("No refundable payment found for this order."));

        if (payment.getProviderPaymentIntentId() == null || payment.getProviderPaymentIntentId().isBlank()) {
            throw new IllegalStateException("Payment is missing a Stripe PaymentIntent.");
        }

        return payment;
    }

    private Refund createRefundRecord(
            Payment payment,
            Order order,
            OrderItem item,
            Integer quantity,
            BigDecimal amount,
            String reason) {
        return refundRepository.save(Refund.builder()
                .payment(payment)
                .order(order)
                .orderItem(item)
                .quantity(quantity)
                .amount(amount)
                .currency(payment.getCurrency())
                .reason(reason)
                .status(RefundStatus.PENDING)
                .build());
    }

    private com.stripe.model.Refund createStripeRefund(Payment payment, Refund refund) {
        return stripeService.createRefund(
                payment.getProviderPaymentIntentId(),
                refund.getAmount(),
                refund.getCurrency(),
                "refund-" + refund.getId());
    }

    private void markRefundSucceeded(Refund refund, com.stripe.model.Refund stripeRefund) {
        refund.setStripeRefundId(stripeRefund.getId());

        if ("failed".equals(stripeRefund.getStatus())) {
            refund.setStatus(RefundStatus.FAILED);
            throw new IllegalStateException("Stripe refund failed.");
        }

        if ("succeeded".equals(stripeRefund.getStatus())) {
            refund.setStatus(RefundStatus.SUCCEEDED);
            refund.setSucceededAt(Instant.now());
            return;
        }

        refund.setStatus(RefundStatus.PENDING);
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
}
