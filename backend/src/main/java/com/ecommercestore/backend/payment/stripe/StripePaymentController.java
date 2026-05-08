package com.ecommercestore.backend.payment.stripe;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders/{orderId}/payments/stripe")
public class StripePaymentController {

    private final StripeService stripeService;

    @PostMapping("/intent")
    public StripePaymentIntentResponse createPaymentIntent(
            @PathVariable("orderId") Long orderId,
            @RequestParam("token") String token) {

        return stripeService.createPaymentIntent(orderId, token);
    }

    @PostMapping("/start")
    public void beginPaymentSubmission(
            @PathVariable("orderId") Long orderId,
            @RequestParam("token") String token) {

        stripeService.beginPaymentSubmission(orderId, token);
    }

    @PostMapping("/confirm")
    public StripePaymentIntentResponse confirmPaymentIntent(
            @PathVariable("orderId") Long orderId,
            @RequestParam("token") String token,
            @RequestParam("paymentIntentId") String paymentIntentId) {

        return stripeService.confirmPaymentIntent(orderId, token, paymentIntentId);
    }
}
