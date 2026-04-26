package com.ecommercestore.backend.delivery;

import com.ecommercestore.backend.delivery.dto.UpdateDeliveryRequest;
import com.ecommercestore.backend.order.Order;
import com.ecommercestore.backend.order.OrderRepository;
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
            case DELIVERED -> {
                if (delivery.getShippedAt() == null) {
                    delivery.setShippedAt(now);
                }

                if (delivery.getDeliveredAt() == null) {
                    delivery.setDeliveredAt(now);
                }
            }
            case CANCELLED -> {
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
