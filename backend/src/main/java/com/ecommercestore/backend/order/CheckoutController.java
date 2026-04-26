package com.ecommercestore.backend.order;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecommercestore.backend.order.dto.OrderResponse;
import com.ecommercestore.backend.order.dto.ReserveOrderRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/checkout/orders")
public class CheckoutController {

    private final OrderService orderService;
    private final OrderMapper orderMapper;

    @PostMapping("/reserve")
    public OrderResponse reserveOrder(
            @Valid @RequestBody ReserveOrderRequest request) {
        return orderMapper.toResponse(orderService.reserveOrder(request));
    }

    @PostMapping("/{orderId}/finalize")
    public OrderResponse finalizeOrder(
            @PathVariable("orderId") Long orderId,
            @RequestParam("token") UUID token) {
        return orderMapper.toResponse(orderService.finalizeOrder(orderId, token));
    }

    @PostMapping("/{orderId}/pay-placeholder")
    public OrderResponse payPlaceholder(
            @PathVariable("orderId") Long orderId,
            @RequestParam("token") UUID token) {
        return orderMapper.toResponse(orderService.markPaidPlaceholder(orderId, token));
    }

    @PostMapping("/{orderId}/cancel")
    public OrderResponse cancelReservation(
            @PathVariable("orderId") Long orderId,
            @RequestParam("token") UUID token) {
        return orderMapper.toResponse(orderService.cancelReservation(orderId, token));
    }

    @GetMapping("/{orderId}")
    public OrderResponse getOrder(
            @PathVariable("orderId") Long orderId,
            @RequestParam("token") UUID token) {
        return orderMapper.toResponse(orderService.getOrderByToken(orderId, token));
    }
}
