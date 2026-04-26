package com.ecommercestore.backend.order.jobs;

import java.time.Instant;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ecommercestore.backend.order.Order;
import com.ecommercestore.backend.order.OrderRepository;
import com.ecommercestore.backend.order.OrderService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ReservationExpirationJob {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void expireReservations() {
        List<Order> expiredOrders = orderRepository.findExpiredReservations(Instant.now());

        for (Order order : expiredOrders) {
            orderService.expireReservation(order);
        }
    }
}
