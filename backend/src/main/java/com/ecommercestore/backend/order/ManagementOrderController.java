package com.ecommercestore.backend.order;

import java.util.List;

import com.ecommercestore.backend.delivery.DeliveryService;
import com.ecommercestore.backend.delivery.dto.UpdateDeliveryRequest;
import com.ecommercestore.backend.order.dto.OrderResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/manager/orders")
public class ManagementOrderController {

    private final OrderService orderService;
    private final OrderMapper orderMapper;
    private final DeliveryService deliveryService;

    @GetMapping
    public List<OrderResponse> getOrders(
            @RequestParam(name = "status", required = false) OrderStatus status) {
        if (status != null) {
            return orderService.getOrdersByStatus(status)
                    .stream()
                    .map(orderMapper::toResponse)
                    .toList();
        }

        return orderService.getAllOrders()
                .stream()
                .map(orderMapper::toResponse)
                .toList();
    }

    @GetMapping("/{orderId}")
    public OrderResponse getOrder(@PathVariable("orderId") Long orderId) {
        return orderMapper.toResponse(
                orderService.getOrderByIdForManagement(orderId));
    }

    @PatchMapping("/{orderId}/delivery")
    public OrderResponse updateDelivery(
            @PathVariable("orderId") Long orderId,
            @RequestBody UpdateDeliveryRequest request) {
        return orderMapper.toResponse(deliveryService.updateManagerDelivery(orderId, request));
    }

    @PostMapping("/{orderId}/items/{orderItemId}/cancel-without-refund")
    public OrderResponse cancelItemWithoutRefund(
            @PathVariable("orderId") Long orderId,
            @PathVariable("orderItemId") Long orderItemId) {
        return orderMapper.toResponse(orderService.cancelPaidItemWithoutRefund(orderId, orderItemId));
    }
}
