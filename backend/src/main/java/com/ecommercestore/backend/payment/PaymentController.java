package com.ecommercestore.backend.payment;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.ecommercestore.backend.payment.dto.PaymentResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/api/orders/{orderId}/payments")
    public PaymentResponse createPendingPayment(
            @PathVariable("orderId") Long orderId,
            @RequestParam("token") String token) {
        return paymentService.createPendingPayment(orderId, token);
    }

    @GetMapping("/api/manager/payments")
    public List<PaymentResponse> getAllPayments() {
        return paymentService.getAllPayments();
    }

    @GetMapping("/api/manager/orders/{orderId}/payments")
    public List<PaymentResponse> getPaymentsForOrder(@PathVariable("orderId") Long orderId) {
        return paymentService.getPaymentsForOrder(orderId);
    }

    @GetMapping("/api/manager/payments/{paymentId}")
    public PaymentResponse getPayment(@PathVariable("paymentId") UUID paymentId) {
        return paymentService.getPayment(paymentId);
    }
}
