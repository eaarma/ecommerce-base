package com.ecommercestore.backend.order;

import com.ecommercestore.backend.delivery.Delivery;
import com.ecommercestore.backend.delivery.DeliveryStatus;
import com.ecommercestore.backend.delivery.dto.ReserveDeliveryRequest;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.ecommercestore.backend.order.dto.ReserveOrderItemRequest;
import com.ecommercestore.backend.order.dto.ReserveOrderRequest;
import com.ecommercestore.backend.product.Product;
import com.ecommercestore.backend.product.ProductRepository;
import com.ecommercestore.backend.product.ProductStatus;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final String DEFAULT_CURRENCY = "EUR";
    private static final BigDecimal DEFAULT_SHIPPING_TOTAL = BigDecimal.ZERO;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Transactional
    public Order reserveOrder(ReserveOrderRequest request) {
        Map<Long, Product> productsById = loadProductsById(request);
        Delivery delivery = buildDelivery(request.delivery());

        Order order = Order.builder()
                .reservationToken(UUID.randomUUID())
                .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                .status(OrderStatus.RESERVED)
                .customerEmail(requireValue(request.customerEmail(), "Customer email"))
                .customerFirstName(requireValue(request.customerFirstName(), "Customer first name"))
                .customerLastName(requireValue(request.customerLastName(), "Customer last name"))
                .currency(DEFAULT_CURRENCY)
                .shippingTotal(DEFAULT_SHIPPING_TOTAL)
                .subtotal(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .build();
        order.setDelivery(delivery);

        BigDecimal subtotal = BigDecimal.ZERO;

        for (ReserveOrderItemRequest itemRequest : request.items()) {
            Product product = productsById.get(itemRequest.productId());

            validateProductAvailable(product, itemRequest.quantity());
            reserveStock(product, itemRequest.quantity());

            BigDecimal lineTotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(itemRequest.quantity()));

            OrderItem item = OrderItem.builder()
                    .product(product)
                    .productSnapshotId(product.getId())
                    .productSnapshotName(product.getName())
                    .productSnapshotImageUrl(product.getImageUrl())
                    .unitPrice(product.getPrice())
                    .quantity(itemRequest.quantity())
                    .lineTotal(lineTotal)
                    .status(OrderItemStatus.RESERVED)
                    .build();

            order.addItem(item);
            subtotal = subtotal.add(lineTotal);
        }

        order.setSubtotal(subtotal);
        order.setTotal(subtotal.add(order.getShippingTotal()));

        return orderRepository.save(order);
    }

    @Transactional(dontRollbackOn = IllegalStateException.class)
    public Order finalizeOrder(Long orderId, String reservationToken) {
        return finalizeOrder(orderId, parseReservationToken(reservationToken));
    }

    @Transactional(dontRollbackOn = IllegalStateException.class)
    public Order prepareOrderForPayment(Long orderId, String reservationToken) {
        Order order = getOrderOrThrow(orderId, parseReservationToken(reservationToken));

        if (order.getStatus() == OrderStatus.PAYMENT_FAILED) {
            order.setStatus(OrderStatus.FINALIZED);
            return orderRepository.save(order);
        }

        return finalizeOrder(orderId, order.getReservationToken());
    }

    @Transactional(dontRollbackOn = IllegalStateException.class)
    public Order finalizeOrder(Long orderId, UUID token) {
        Order order = getOrderOrThrow(orderId, token);

        if (order.getStatus() == OrderStatus.FINALIZED) {
            return order;
        }

        if (order.getStatus() != OrderStatus.RESERVED) {
            throw new IllegalStateException("Only reserved or finalized orders can be used for payment.");
        }

        if (order.getExpiresAt() != null && order.getExpiresAt().isBefore(Instant.now())) {
            expireReservation(order);
            throw new IllegalStateException("Order reservation has expired.");
        }

        order.setStatus(OrderStatus.FINALIZED);
        order.setFinalizedAt(Instant.now());
        order.getItems().forEach(item -> item.setStatus(OrderItemStatus.ORDERED));

        return orderRepository.save(order);
    }

    @Transactional
    public Order markPaidPlaceholder(Long orderId, UUID token) {
        Order order = getOrderOrThrow(orderId, token);

        return markPaid(order);
    }

    @Transactional
    public void markPaid(Long orderId) {
        Order order = getOrderByIdOrThrow(orderId);
        markPaid(order);
    }

    @Transactional
    public void markPaymentFailed(Long orderId) {
        Order order = getOrderByIdOrThrow(orderId);

        if (order.getStatus() == OrderStatus.PAID
                || order.getStatus() == OrderStatus.PAYMENT_FAILED) {
            return;
        }

        if (order.getStatus() != OrderStatus.FINALIZED) {
            throw new IllegalStateException("Only finalized orders can be marked as payment failed.");
        }

        order.setStatus(OrderStatus.PAYMENT_FAILED);
        orderRepository.save(order);
    }

    @Transactional
    public Order getOrderByToken(Long orderId, UUID token) {
        return getOrderOrThrow(orderId, token);
    }

    private Order getOrderOrThrow(Long orderId, UUID token) {
        return orderRepository.findByIdAndReservationToken(orderId, token)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));
    }

    private Order getOrderByIdOrThrow(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));
    }

    private UUID parseReservationToken(String reservationToken) {
        try {
            return UUID.fromString(reservationToken);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid reservation token.", exception);
        }
    }

    private Order markPaid(Order order) {
        if (order.getStatus() == OrderStatus.PAID) {
            return order;
        }

        if (order.getStatus() != OrderStatus.FINALIZED
                && order.getStatus() != OrderStatus.PAYMENT_FAILED) {
            throw new IllegalStateException("Only finalized orders can be marked as paid.");
        }

        order.setStatus(OrderStatus.PAID);
        order.setPaidAt(Instant.now());

        if (order.getDelivery() != null && order.getDelivery().getStatus() == DeliveryStatus.NOT_READY) {
            order.getDelivery().setStatus(DeliveryStatus.READY_TO_SHIP);
        }

        return orderRepository.save(order);
    }

    private Map<Long, Product> loadProductsById(ReserveOrderRequest request) {
        var productIds = request.items()
                .stream()
                .map(ReserveOrderItemRequest::productId)
                .collect(Collectors.toSet());

        var products = productRepository.findAllById(productIds);

        if (products.size() != productIds.size()) {
            throw new IllegalArgumentException("One or more products were not found.");
        }

        return products.stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
    }

    private void validateProductAvailable(Product product, int requestedQuantity) {
        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalStateException("Product is not available.");
        }

        if (product.getStockQuantity() < requestedQuantity) {
            throw new IllegalStateException("Not enough stock available.");
        }
    }

    private void reserveStock(Product product, int quantity) {
        product.setStockQuantity(product.getStockQuantity() - quantity);

        if (product.getStockQuantity() <= 0) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        }
    }

    public void restockReservedItems(Order order) {
        restockReservedItems(order, OrderItemStatus.EXPIRED);
    }

    public void expireReservation(Order order) {
        restockReservedItems(order, OrderItemStatus.EXPIRED);
        order.setStatus(OrderStatus.EXPIRED);

        if (order.getDelivery() != null) {
            order.getDelivery().setStatus(DeliveryStatus.CANCELLED);
        }
    }

    @Transactional
    public Order cancelReservation(Long orderId, UUID token) {
        Order order = getOrderOrThrow(orderId, token);

        if (order.getStatus() != OrderStatus.RESERVED) {
            throw new IllegalStateException("Only reserved orders can be cancelled.");
        }

        restockReservedItems(order, OrderItemStatus.CANCELLED);
        order.setStatus(OrderStatus.CANCELLED);

        if (order.getDelivery() != null) {
            order.getDelivery().setStatus(DeliveryStatus.CANCELLED);
        }

        return orderRepository.save(order);
    }

    private void restockReservedItems(Order order, OrderItemStatus itemStatus) {
        for (OrderItem item : order.getItems()) {
            if (item.getStatus() != OrderItemStatus.RESERVED) {
                continue;
            }

            Product product = item.getProduct();

            if (product == null) {
                continue;
            }

            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());

            if (product.getStatus() == ProductStatus.OUT_OF_STOCK
                    && product.getStockQuantity() > 0) {
                product.setStatus(ProductStatus.ACTIVE);
            }

            item.setStatus(itemStatus);
        }
    }

    @Transactional
    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public List<Order> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional
    public Order getOrderByIdForManagement(Long orderId) {
        return orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));
    }

    private Delivery buildDelivery(ReserveDeliveryRequest request) {
        Delivery delivery = Delivery.builder()
                .method(request.method())
                .status(DeliveryStatus.NOT_READY)
                .recipientName(requireValue(request.recipientName(), "Recipient name"))
                .recipientPhone(requireValue(request.recipientPhone(), "Recipient phone"))
                .recipientEmail(requireValue(request.recipientEmail(), "Recipient email"))
                .carrier(request.carrier())
                .build();

        switch (request.method()) {
            case PARCEL_LOCKER -> {
                delivery.setParcelLockerId(requireValue(request.parcelLockerId(), "Parcel locker ID"));
                delivery.setParcelLockerName(requireValue(request.parcelLockerName(), "Parcel locker name"));
                delivery.setParcelLockerAddress(requireValue(request.parcelLockerAddress(), "Parcel locker address"));
            }
            case POSTAL_DELIVERY -> {
                delivery.setAddressLine1(requireValue(request.addressLine1(), "Address line 1"));
                delivery.setAddressLine2(normalizeOptional(request.addressLine2()));
                delivery.setCity(requireValue(request.city(), "City"));
                delivery.setPostalCode(requireValue(request.postalCode(), "Postal code"));
                delivery.setCountry(requireValue(request.country(), "Country"));
            }
        }

        return delivery;
    }

    private String requireValue(String value, String fieldName) {
        String normalized = normalizeOptional(value);

        if (normalized == null) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }

        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
