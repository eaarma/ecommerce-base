package com.ecommercestore.backend.payment.refund;

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
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RefundService {

    private static final List<PaymentStatus> REFUNDABLE_PAYMENT_STATUSES = List.of(
            PaymentStatus.SUCCEEDED,
            PaymentStatus.PARTIALLY_REFUNDED);
    private static final List<OrderItemStatus> ITEM_REFUNDABLE_STATUSES = List.of(
            OrderItemStatus.ORDERED,
            OrderItemStatus.PARTIALLY_REFUNDED);
    private static final List<OrderItemStatus> FULL_ORDER_REFUNDABLE_ITEM_STATUSES = List.of(
            OrderItemStatus.ORDERED,
            OrderItemStatus.PARTIALLY_REFUNDED,
            OrderItemStatus.REFUNDED);

    private final RefundRepository refundRepository;
    private final RefundMapper refundMapper;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final StripeService stripeService;
    private final RefundTransactionService refundTransactionService;

    @Transactional
    public RefundResponse refundOrder(Long orderId, String reason) {
        Order order = getRefundableOrder(orderId);
        validateFullOrderRefundableItems(order);
        Payment payment = getRefundablePayment(orderId);
        BigDecimal alreadyRefunded = refundRepository.sumSucceededAmountByPaymentId(payment.getId());
        BigDecimal amount = payment.getAmount().subtract(alreadyRefunded);

        if (amount.signum() <= 0) {
            throw new IllegalStateException("Order has already been fully refunded.");
        }

        Refund refund = refundTransactionService.createOrReuseRefundIntent(
                payment.getId(),
                order.getId(),
                null,
                null,
                amount,
                payment.getCurrency(),
                reason);
        Refund finalizedRefund = finalizeRefundAttempt(payment, refund);

        return refundMapper.toResponse(finalizedRefund);
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
        validateRefundableItemState(item);

        int alreadyRefunded = refundRepository.sumSucceededQuantityByOrderItemId(orderItemId);
        int remainingQuantity = item.getQuantity() - alreadyRefunded;

        if (quantity > remainingQuantity) {
            throw new IllegalStateException("Refund quantity exceeds the remaining refundable quantity.");
        }

        Payment payment = getRefundablePayment(orderId);
        BigDecimal amount = item.getUnitPrice().multiply(BigDecimal.valueOf(quantity));

        if (amount.signum() <= 0) {
            throw new IllegalStateException("Refund amount must be greater than zero.");
        }

        BigDecimal remainingPaymentAmount = payment.getAmount()
                .subtract(refundRepository.sumSucceededAmountByPaymentId(payment.getId()));

        if (amount.compareTo(remainingPaymentAmount) > 0) {
            throw new IllegalStateException("Refund amount exceeds the remaining refundable payment amount.");
        }

        Refund refund = refundTransactionService.createOrReuseRefundIntent(
                payment.getId(),
                order.getId(),
                item.getId(),
                quantity,
                amount,
                payment.getCurrency(),
                reason);
        Refund finalizedRefund = finalizeRefundAttempt(payment, refund);

        return refundMapper.toResponse(finalizedRefund);
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

    private Refund finalizeRefundAttempt(Payment payment, Refund refund) {
        if (refund.getStatus() == RefundStatus.SUCCEEDED) {
            return refund;
        }

        com.stripe.model.Refund stripeRefund = stripeService.createRefund(
                payment.getProviderPaymentIntentId(),
                refund.getAmount(),
                refund.getCurrency(),
                "refund-" + refund.getId());

        return refundTransactionService.finalizeRefundFromStripe(refund.getId(), stripeRefund);
    }

    private void validateFullOrderRefundableItems(Order order) {
        boolean hasNonRefundableItems = order.getItems()
                .stream()
                .map(OrderItem::getStatus)
                .anyMatch(status -> !FULL_ORDER_REFUNDABLE_ITEM_STATUSES.contains(status));

        if (hasNonRefundableItems) {
            throw new IllegalStateException("Order contains items that cannot be refunded.");
        }
    }

    private void validateRefundableItemState(OrderItem item) {
        if (!ITEM_REFUNDABLE_STATUSES.contains(item.getStatus())) {
            throw new IllegalStateException("Only ordered or partially refunded items can be refunded.");
        }
    }
}
