package com.ecommercestore.backend.delivery;

import com.ecommercestore.backend.delivery.dto.UpdateDeliveryRequest;
import com.ecommercestore.backend.order.Order;
import com.ecommercestore.backend.order.OrderRepository;
import com.ecommercestore.backend.order.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final OrderRepository orderRepository;

    @Transactional
    public Order updateManagerDelivery(Long orderId, UpdateDeliveryRequest request) {
        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));

        Delivery delivery = order.getDelivery();

        if (delivery == null) {
            throw new IllegalStateException("Delivery not found.");
        }

        validateTrackingUpdate(delivery, request);

        if (request.status() != null) {
            validateStatusTransition(order, delivery, request.status());
        }

        if (request.carrier() != null) {
            delivery.setCarrier(request.carrier());
        }

        if (request.trackingNumber() != null) {
            delivery.setTrackingNumber(normalizeOptional(request.trackingNumber()));
        }

        if (request.trackingUrl() != null) {
            delivery.setTrackingUrl(normalizeOptional(request.trackingUrl()));
        }

        if (request.status() != null) {
            applyStatusTransition(delivery, request.status());
        }

        return orderRepository.save(order);
    }

    private void validateTrackingUpdate(Delivery delivery, UpdateDeliveryRequest request) {
        boolean trackingUpdated = isTrackingValueChanged(request.trackingNumber(), delivery.getTrackingNumber())
                || isTrackingValueChanged(request.trackingUrl(), delivery.getTrackingUrl());
        DeliveryStatus effectiveStatus = request.status() != null
                ? request.status()
                : delivery.getStatus();

        if (trackingUpdated && effectiveStatus == DeliveryStatus.CANCELLED) {
            throw new IllegalStateException("Tracking cannot be updated for cancelled delivery.");
        }
    }

    private boolean isTrackingValueChanged(String requestedValue, String currentValue) {
        if (requestedValue == null) {
            return false;
        }

        String normalizedRequested = normalizeOptional(requestedValue);
        String normalizedCurrent = normalizeOptional(currentValue);

        if (normalizedRequested == null) {
            return normalizedCurrent != null;
        }

        return !normalizedRequested.equals(normalizedCurrent);
    }

    private void validateStatusTransition(Order order, Delivery delivery, DeliveryStatus targetStatus) {
        DeliveryStatus currentStatus = delivery.getStatus();

        if (currentStatus == targetStatus) {
            return;
        }

        switch (targetStatus) {
            case NOT_READY -> throw new IllegalStateException("Delivery cannot be moved back to not ready.");
            case READY_TO_SHIP -> validateReadyToShip(order);
            case SHIPPED -> validateShipped(order);
            case SENT_BACK -> validateSentBack(order, currentStatus);
            case DELIVERED -> validateDelivered(order, currentStatus);
            case CANCELLED -> validateCancelled(order);
        }
    }

    private void validateReadyToShip(Order order) {
        if (!isDeliveryOperationalOrderStatus(order.getStatus())) {
            throw new IllegalStateException(
                    "Only paid, partially refunded, or closed paid orders can be marked ready to ship.");
        }
    }

    private void validateShipped(Order order) {
        if (!isDeliveryOperationalOrderStatus(order.getStatus())) {
            throw new IllegalStateException(
                    "Only paid, partially refunded, or closed paid orders can be shipped.");
        }
    }

    private void validateSentBack(Order order, DeliveryStatus currentStatus) {
        if (currentStatus == DeliveryStatus.NOT_READY) {
            throw new IllegalStateException("Delivery can only be sent back after it has been prepared for shipment.");
        }

        if (!isDeliveryOperationalOrderStatus(order.getStatus())) {
            throw new IllegalStateException(
                    "Only paid, partially refunded, or closed paid orders can be marked as sent back.");
        }
    }

    private void validateDelivered(Order order, DeliveryStatus currentStatus) {
        if (currentStatus != DeliveryStatus.SHIPPED) {
            throw new IllegalStateException("Delivery can only be marked delivered after it has been shipped.");
        }

        if (!isFulfillmentPaid(order.getStatus())) {
            throw new IllegalStateException("Only paid or partially refunded orders can be marked delivered.");
        }
    }

    private void validateCancelled(Order order) {
        if (!isCancelableDeliveryOrderStatus(order.getStatus())) {
            throw new IllegalStateException("Delivery can only be cancelled for cancelled, expired, or fully refunded orders.");
        }
    }

    private boolean isFulfillmentPaid(OrderStatus status) {
        return status == OrderStatus.PAID || status == OrderStatus.PARTIALLY_REFUNDED;
    }

    private boolean isDeliveryOperationalOrderStatus(OrderStatus status) {
        return isFulfillmentPaid(status)
                || status == OrderStatus.CANCELLED
                || status == OrderStatus.REFUNDED
                || status == OrderStatus.CANCELLED_REFUNDED;
    }

    private boolean isCancelableDeliveryOrderStatus(OrderStatus status) {
        return status == OrderStatus.CANCELLED
                || status == OrderStatus.EXPIRED
                || status == OrderStatus.REFUNDED
                || status == OrderStatus.CANCELLED_REFUNDED;
    }

    private void applyStatusTransition(Delivery delivery, DeliveryStatus status) {
        Instant now = Instant.now();

        switch (status) {
            case NOT_READY -> {
                delivery.setShippedAt(null);
                delivery.setDeliveredAt(null);
            }
            case READY_TO_SHIP -> {
                delivery.setShippedAt(null);
                delivery.setDeliveredAt(null);
            }
            case SHIPPED -> {
                if (delivery.getShippedAt() == null) {
                    delivery.setShippedAt(now);
                }

                delivery.setDeliveredAt(null);
            }
            case SENT_BACK -> {
                if (delivery.getShippedAt() == null) {
                    delivery.setShippedAt(now);
                }

                delivery.setDeliveredAt(null);
            }
            case DELIVERED -> {
                if (delivery.getShippedAt() == null) {
                    delivery.setShippedAt(now);
                }

                if (delivery.getDeliveredAt() == null) {
                    delivery.setDeliveredAt(now);
                }
            }
            case CANCELLED -> {
                delivery.setTrackingNumber(null);
                delivery.setTrackingUrl(null);
                delivery.setShippedAt(null);
                delivery.setDeliveredAt(null);
            }
        }

        delivery.setStatus(status);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
