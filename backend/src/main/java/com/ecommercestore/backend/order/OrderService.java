package com.ecommercestore.backend.order;

import com.ecommercestore.backend.delivery.Delivery;
import com.ecommercestore.backend.delivery.DeliveryStatus;
import com.ecommercestore.backend.delivery.dto.ReserveDeliveryRequest;
import com.ecommercestore.backend.email.OrderEmailRequestedEvent;
import com.ecommercestore.backend.email.OrderEmailType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;

import com.ecommercestore.backend.order.dto.ReserveOrderItemRequest;
import com.ecommercestore.backend.order.dto.ReserveOrderRequest;
import com.ecommercestore.backend.product.Product;
import com.ecommercestore.backend.product.ProductVariant;
import com.ecommercestore.backend.product.ProductVariantRepository;
import com.ecommercestore.backend.product.ProductStatus;
import com.ecommercestore.backend.product.ProductMapper;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final long RESERVATION_HOLD_MINUTES = 15;
    private static final long PAYMENT_PROCESSING_GRACE_MINUTES = 5;
    private static final long FINALIZED_HOLD_MINUTES = RESERVATION_HOLD_MINUTES + PAYMENT_PROCESSING_GRACE_MINUTES;
    private static final String DEFAULT_CURRENCY = "EUR";
    private static final BigDecimal DEFAULT_SHIPPING_TOTAL = BigDecimal.ZERO;
    private static final String STALE_CART_MESSAGE = "Some items are no longer available. Please review your cart.";
    private static final String RESERVATION_EXPIRED_MESSAGE = "Order reservation has expired.";

    private final OrderRepository orderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductMapper productMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Order reserveOrder(ReserveOrderRequest request) {
        Delivery delivery = buildDelivery(request.delivery());
        Map<Long, ProductVariant> variantsById = loadVariantsById(request);

        Order order = Order.builder()
                .reservationToken(UUID.randomUUID())
                .expiresAt(Instant.now().plus(RESERVATION_HOLD_MINUTES, ChronoUnit.MINUTES))
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
            ProductVariant variant = variantsById.get(itemRequest.variantId());
            Product product = variant.getProduct();

            validateProductAvailable(
                    product,
                    variant,
                    itemRequest.productId(),
                    itemRequest.quantity(),
                    itemRequest.expectedUnitPrice());
            reserveStock(product, variant, itemRequest.quantity());

            BigDecimal lineTotal = variant.getPrice()
                    .multiply(BigDecimal.valueOf(itemRequest.quantity()));

            OrderItem item = OrderItem.builder()
                    .product(product)
                    .variant(variant)
                    .productSnapshotId(product.getId())
                    .productSnapshotName(product.getName())
                    .productSnapshotImageUrl(resolveSnapshotImageUrl(product, variant))
                    .variantSnapshotId(variant.getId())
                    .variantSnapshotSku(variant.getSku())
                    .variantSnapshotLabel(productMapper.buildVariantLabel(variant))
                    .variantSnapshotColor(variant.getColor())
                    .variantSnapshotSize(variant.getSize())
                    .variantSnapshotWeight(variant.getWeight())
                    .variantSnapshotMaterial(variant.getMaterial())
                    .unitPrice(variant.getPrice())
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
        expireUnpaidOrderIfNeeded(order);

        if (order.getStatus() == OrderStatus.EXPIRED) {
            throw new IllegalStateException(RESERVATION_EXPIRED_MESSAGE);
        }

        if (order.getStatus() == OrderStatus.PAYMENT_FAILED) {
            order.setStatus(OrderStatus.FINALIZED);
            order.setExpiresAt(resolveReservationExpiration(order));
            return orderRepository.save(order);
        }

        return finalizeOrder(orderId, order.getReservationToken());
    }

    @Transactional(dontRollbackOn = IllegalStateException.class)
    public Order finalizeOrder(Long orderId, UUID token) {
        Order order = getOrderOrThrow(orderId, token);
        expireUnpaidOrderIfNeeded(order);

        if (order.getStatus() == OrderStatus.FINALIZED) {
            Instant reservationExpiration = resolveReservationExpiration(order);

            if (order.getExpiresAt() == null || order.getExpiresAt().isBefore(reservationExpiration)) {
                order.setExpiresAt(reservationExpiration);
                return orderRepository.save(order);
            }

            return order;
        }

        if (order.getStatus() == OrderStatus.EXPIRED) {
            throw new IllegalStateException(RESERVATION_EXPIRED_MESSAGE);
        }

        if (order.getStatus() != OrderStatus.RESERVED) {
            throw new IllegalStateException("Only reserved or finalized orders can be used for payment.");
        }

        order.setStatus(OrderStatus.FINALIZED);
        order.setFinalizedAt(Instant.now());
        order.setExpiresAt(resolveReservationExpiration(order));

        return orderRepository.save(order);
    }

    @Transactional(dontRollbackOn = IllegalStateException.class)
    public Order beginPaymentSubmission(Long orderId, String reservationToken) {
        return beginPaymentSubmission(orderId, parseReservationToken(reservationToken));
    }

    @Transactional(dontRollbackOn = IllegalStateException.class)
    public Order beginPaymentSubmission(Long orderId, UUID token) {
        Order order = getOrderOrThrow(orderId, token);
        expireUnpaidOrderIfNeeded(order);

        if (order.getStatus() == OrderStatus.EXPIRED) {
            throw new IllegalStateException(RESERVATION_EXPIRED_MESSAGE);
        }

        if (!isPaymentStartWindowOpen(order)) {
            expireReservation(order);
            throw new IllegalStateException(RESERVATION_EXPIRED_MESSAGE);
        }

        if (order.getStatus() != OrderStatus.RESERVED
                && order.getStatus() != OrderStatus.FINALIZED
                && order.getStatus() != OrderStatus.PAYMENT_FAILED) {
            throw new IllegalStateException("Only unpaid orders can start a payment attempt.");
        }

        order.setStatus(OrderStatus.FINALIZED);

        if (order.getFinalizedAt() == null) {
            order.setFinalizedAt(Instant.now());
        }

        Instant finalizedExpiration = resolveFinalizedExpiration(order);

        if (!finalizedExpiration.equals(order.getExpiresAt())) {
            order.setExpiresAt(finalizedExpiration);
            return orderRepository.save(order);
        }

        return order;
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
        expireUnpaidOrderIfNeeded(order);

        if (order.getStatus() == OrderStatus.PAID
                || order.getStatus() == OrderStatus.PAYMENT_FAILED
                || order.getStatus() == OrderStatus.EXPIRED) {
            return;
        }

        if (order.getStatus() != OrderStatus.FINALIZED) {
            throw new IllegalStateException("Only finalized orders can be marked as payment failed.");
        }

        if (!isPaymentStartWindowOpen(order)) {
            expireReservation(order);
            orderRepository.save(order);
            return;
        }

        order.setStatus(OrderStatus.PAYMENT_FAILED);
        order.setExpiresAt(resolveReservationExpiration(order));
        orderRepository.save(order);
    }

    @Transactional
    public Order getOrderByToken(Long orderId, UUID token) {
        Order order = getOrderOrThrow(orderId, token);
        expireUnpaidOrderIfNeeded(order);
        return order;
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
        order.setExpiresAt(null);
        order.getItems().forEach(item -> {
            if (item.getStatus() == OrderItemStatus.RESERVED) {
                item.setStatus(OrderItemStatus.ORDERED);
            }
        });

        if (order.getDelivery() != null && order.getDelivery().getStatus() == DeliveryStatus.NOT_READY) {
            order.getDelivery().setStatus(DeliveryStatus.READY_TO_SHIP);
        }

        Order savedOrder = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderEmailRequestedEvent(savedOrder.getId(), OrderEmailType.CONFIRMATION, null, null));
        return savedOrder;
    }

    private Map<Long, ProductVariant> loadVariantsById(ReserveOrderRequest request) {
        var variantIds = request.items()
                .stream()
                .map(ReserveOrderItemRequest::variantId)
                .collect(Collectors.toSet());

        var variants = productVariantRepository.findAllByIdIn(variantIds);

        if (variants.size() != variantIds.size()) {
            throw new IllegalStateException(STALE_CART_MESSAGE);
        }

        return variants.stream()
                .collect(Collectors.toMap(ProductVariant::getId, Function.identity()));
    }

    private void validateProductAvailable(
            Product product,
            ProductVariant variant,
            Long requestedProductId,
            int requestedQuantity,
            BigDecimal expectedUnitPrice) {
        if (!product.getId().equals(requestedProductId)) {
            throw new IllegalStateException(STALE_CART_MESSAGE);
        }

        if (requestedQuantity <= 0) {
            throw new IllegalArgumentException("Requested quantity must be greater than zero.");
        }

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalStateException(STALE_CART_MESSAGE);
        }

        if (variant.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalStateException(STALE_CART_MESSAGE);
        }

        if (expectedUnitPrice != null && variant.getPrice().compareTo(expectedUnitPrice) != 0) {
            throw new IllegalStateException(STALE_CART_MESSAGE);
        }

        if (variant.getStockQuantity() == null || variant.getStockQuantity() < requestedQuantity) {
            throw new IllegalStateException(STALE_CART_MESSAGE);
        }
    }

    private void reserveStock(Product product, ProductVariant variant, int quantity) {
        variant.setStockQuantity(variant.getStockQuantity() - quantity);

        if (variant.getStockQuantity() <= 0) {
            variant.setStatus(ProductStatus.OUT_OF_STOCK);
        }

        syncProductStatus(product);
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
        expireUnpaidOrderIfNeeded(order);

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

    @Transactional
    public Order cancelPaidItemWithoutRefund(Long orderId, Long orderItemId) {
        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));

        if (order.getStatus() != OrderStatus.PAID) {
            throw new IllegalStateException("Only paid orders can cancel items without refund.");
        }

        OrderItem item = order.getItems()
                .stream()
                .filter(orderItem -> orderItem.getId().equals(orderItemId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Order item not found."));

        if (item.getStatus() != OrderItemStatus.ORDERED) {
            throw new IllegalStateException("Only ordered items can be cancelled without refund.");
        }

        item.setStatus(OrderItemStatus.CANCELLED_NO_REFUND);
        updatePaidOrderStatusAfterItemCancellation(order);
        return orderRepository.save(order);
    }

    private void updatePaidOrderStatusAfterItemCancellation(Order order) {
        boolean allCancelledWithoutRefund = order.getItems()
                .stream()
                .allMatch(item -> item.getStatus() == OrderItemStatus.CANCELLED_NO_REFUND);

        if (allCancelledWithoutRefund) {
            order.setStatus(OrderStatus.CANCELLED);
            cancelDeliveryIfUnshipped(order);
            return;
        }

        order.setStatus(OrderStatus.PAID);
    }

    private void cancelDeliveryIfUnshipped(Order order) {
        if (order.getDelivery() == null) {
            return;
        }

        if (order.getDelivery().getStatus() == DeliveryStatus.SHIPPED
                || order.getDelivery().getStatus() == DeliveryStatus.SENT_BACK
                || order.getDelivery().getStatus() == DeliveryStatus.DELIVERED) {
            return;
        }

        order.getDelivery().setStatus(DeliveryStatus.CANCELLED);
        order.getDelivery().setTrackingNumber(null);
        order.getDelivery().setTrackingUrl(null);
        order.getDelivery().setShippedAt(null);
        order.getDelivery().setDeliveredAt(null);
    }

    private void expireUnpaidOrderIfNeeded(Order order) {
        if (!isExpirableUnpaidStatus(order.getStatus()) || order.getExpiresAt() == null) {
            return;
        }

        if (!order.getExpiresAt().isAfter(Instant.now())) {
            expireReservation(order);
        }
    }

    private boolean isExpirableUnpaidStatus(OrderStatus status) {
        return status == OrderStatus.RESERVED
                || status == OrderStatus.FINALIZED
                || status == OrderStatus.PAYMENT_FAILED;
    }

    private Instant resolveFinalizedExpiration(Order order) {
        Instant baseTime = order.getCreatedAt() != null
                ? order.getCreatedAt()
                : Instant.now();

        return baseTime.plus(FINALIZED_HOLD_MINUTES, ChronoUnit.MINUTES);
    }

    private Instant resolveReservationExpiration(Order order) {
        Instant baseTime = order.getCreatedAt() != null
                ? order.getCreatedAt()
                : Instant.now();

        return baseTime.plus(RESERVATION_HOLD_MINUTES, ChronoUnit.MINUTES);
    }

    private boolean isPaymentStartWindowOpen(Order order) {
        return resolveReservationExpiration(order).isAfter(Instant.now());
    }

    private void restockReservedItems(Order order, OrderItemStatus itemStatus) {
        for (OrderItem item : order.getItems()) {
            if (item.getStatus() != OrderItemStatus.RESERVED) {
                continue;
            }

            ProductVariant variant = item.getVariant();
            Product product = item.getProduct();

            if (variant == null || product == null) {
                continue;
            }

            variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());

            if (variant.getStatus() == ProductStatus.OUT_OF_STOCK
                    && variant.getStockQuantity() > 0) {
                variant.setStatus(ProductStatus.ACTIVE);
            }

            syncProductStatus(product);
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

    private String resolveSnapshotImageUrl(Product product, ProductVariant variant) {
        if (normalizeOptional(variant.getImageUrl()) != null) {
            return variant.getImageUrl().trim();
        }

        if (normalizeOptional(product.getMainImageUrl()) != null) {
            return product.getMainImageUrl().trim();
        }

        return product.getImages()
                .stream()
                .map(image -> normalizeOptional(image.getUrl()))
                .filter(value -> value != null)
                .findFirst()
                .orElse(null);
    }

    private void syncProductStatus(Product product) {
        product.getVariants().forEach(this::syncVariantStatus);

        boolean hasStock = product.getVariants()
                .stream()
                .anyMatch(variant -> variant.getStatus() == ProductStatus.ACTIVE
                        && variant.getStockQuantity() != null
                        && variant.getStockQuantity() > 0);

        if (product.getStatus() != ProductStatus.ARCHIVED && product.getStatus() != ProductStatus.DRAFT) {
            product.setStatus(hasStock ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK);
        }
    }

    private void syncVariantStatus(ProductVariant variant) {
        if (variant.getStatus() == ProductStatus.ARCHIVED || variant.getStatus() == ProductStatus.DRAFT) {
            return;
        }

        variant.setStatus(
                variant.getStockQuantity() != null && variant.getStockQuantity() > 0
                        ? ProductStatus.ACTIVE
                        : ProductStatus.OUT_OF_STOCK);
    }
}
