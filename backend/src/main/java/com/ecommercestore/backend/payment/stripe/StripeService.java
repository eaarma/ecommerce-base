package com.ecommercestore.backend.payment.stripe;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import com.stripe.net.RequestOptions;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ecommercestore.backend.order.Order;
import com.ecommercestore.backend.order.OrderService;
import com.ecommercestore.backend.payment.Payment;
import com.ecommercestore.backend.payment.PaymentRepository;
import com.ecommercestore.backend.payment.PaymentService;
import com.ecommercestore.backend.payment.PaymentStatus;
import com.ecommercestore.backend.payment.dto.PaymentResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StripeService {

        private final PaymentService paymentService;
        private final PaymentRepository paymentRepository;
        private final StripeProperties stripeProperties;
        private final OrderService orderService;

        @Transactional
        public void beginPaymentSubmission(Long orderId, String token) {
                orderService.beginPaymentSubmission(orderId, token);
        }

        @Transactional
        public StripePaymentIntentResponse createPaymentIntent(Long orderId, String token) {
                Payment payment = paymentService.createOrReusePendingPaymentEntity(orderId, token);
                Order order = payment.getOrder();

                if (payment.getAmount() == null || payment.getAmount().signum() <= 0) {
                        throw new IllegalStateException("Payment amount must be greater than zero");
                }

                if (payment.getProviderPaymentIntentId() != null) {
                        try {
                                PaymentIntent existingIntent = PaymentIntent
                                                .retrieve(payment.getProviderPaymentIntentId());

                                if ("succeeded".equals(existingIntent.getStatus())) {
                                        PaymentResponse updatedPayment = paymentService.markSucceeded(
                                                        existingIntent.getId(),
                                                        existingIntent.getLatestCharge());

                                        return new StripePaymentIntentResponse(
                                                        payment.getId(),
                                                        order.getId(),
                                                        null,
                                                        payment.getAmount(),
                                                        payment.getCurrency(),
                                                        updatedPayment.status());
                                }

                                if ("canceled".equals(existingIntent.getStatus())) {
                                        paymentService.markFailed(
                                                        existingIntent.getId(),
                                                        existingIntent.getCancellationReason(),
                                                        "Stripe payment status: " + existingIntent.getStatus());

                                        throw new IllegalStateException("Stripe payment was cancelled.");
                                }

                                return new StripePaymentIntentResponse(
                                                payment.getId(),
                                                order.getId(),
                                                existingIntent.getClientSecret(),
                                                payment.getAmount(),
                                                payment.getCurrency(),
                                                payment.getStatus());
                        } catch (IllegalStateException ex) {
                                throw ex;
                        } catch (Exception ex) {
                                log.warn("Failed to retrieve existing Stripe PaymentIntent for payment {}",
                                                payment.getId(), ex);
                        }
                }

                try {
                        long amountCents = toMinorUnit(payment.getAmount());

                        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                                        .setAmount(amountCents)
                                        .setCurrency(payment.getCurrency().toLowerCase())
                                        .addPaymentMethodType("card")
                                        .putMetadata("orderId", order.getId().toString())
                                        .putMetadata("paymentId", payment.getId().toString())
                                        .build();

                        RequestOptions options = RequestOptions.builder()
                                        .setIdempotencyKey("payment-" + payment.getId())
                                        .build();

                        PaymentIntent intent = PaymentIntent.create(params, options);

                        payment.setProviderPaymentIntentId(intent.getId());
                        payment.setStatus(PaymentStatus.PENDING);
                        paymentRepository.save(payment);

                        return new StripePaymentIntentResponse(
                                        payment.getId(),
                                        order.getId(),
                                        intent.getClientSecret(),
                                        payment.getAmount(),
                                        payment.getCurrency(),
                                        payment.getStatus());
                } catch (Exception ex) {
                        log.error("Stripe PaymentIntent creation failed for order {}", orderId, ex);
                        throw new IllegalStateException("Stripe payment creation failed");
                }
        }

        @Transactional
        public StripePaymentIntentResponse confirmPaymentIntent(
                        Long orderId,
                        String token,
                        String paymentIntentId) {
                if (paymentIntentId == null || paymentIntentId.isBlank()) {
                        throw new IllegalArgumentException("PaymentIntent id is required.");
                }

                Order order = orderService.getOrderByToken(orderId, parseReservationToken(token));
                Payment payment = paymentRepository.findByProviderPaymentIntentId(paymentIntentId)
                                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));

                if (!payment.getOrder().getId().equals(order.getId())) {
                        throw new IllegalArgumentException("Payment does not belong to this order.");
                }

                try {
                        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);

                        if ("succeeded".equals(intent.getStatus())) {
                                PaymentResponse updatedPayment = paymentService.markSucceeded(
                                                intent.getId(),
                                                intent.getLatestCharge());

                                return new StripePaymentIntentResponse(
                                                payment.getId(),
                                                order.getId(),
                                                null,
                                                payment.getAmount(),
                                                payment.getCurrency(),
                                                updatedPayment.status());
                        }

                        if ("canceled".equals(intent.getStatus())) {
                                PaymentResponse updatedPayment = paymentService.markFailed(
                                                intent.getId(),
                                                intent.getCancellationReason(),
                                                "Stripe payment status: " + intent.getStatus());

                                return new StripePaymentIntentResponse(
                                                payment.getId(),
                                                order.getId(),
                                                null,
                                                payment.getAmount(),
                                                payment.getCurrency(),
                                                updatedPayment.status());
                        }

                        return new StripePaymentIntentResponse(
                                        payment.getId(),
                                        order.getId(),
                                        null,
                                        payment.getAmount(),
                                        payment.getCurrency(),
                                        payment.getStatus());
                } catch (IllegalArgumentException ex) {
                        throw ex;
                } catch (Exception ex) {
                        log.error("Stripe PaymentIntent confirmation failed for order {}", orderId, ex);
                        throw new IllegalStateException("Stripe payment confirmation failed");
                }
        }

        @Transactional
        public void handleWebhook(String payload, String signature) {
                Event event = constructWebhookEvent(payload, signature);

                log.info("Processing Stripe webhook event {} of type {}", event.getId(), event.getType());

                switch (event.getType()) {
                        case "payment_intent.succeeded" -> handlePaymentIntentSucceeded(event);
                        case "payment_intent.payment_failed", "payment_intent.canceled" ->
                                handlePaymentIntentFailed(event);
                        default -> log.debug("Ignoring Stripe webhook event {}", event.getType());
                }
        }

        private Event constructWebhookEvent(String payload, String signature) {
                try {
                        return Webhook.constructEvent(
                                        payload,
                                        signature,
                                        stripeProperties.getWebhookSecret());
                } catch (SignatureVerificationException ex) {
                        log.warn("Rejected Stripe webhook with invalid signature");
                        throw new IllegalArgumentException("Invalid Stripe webhook signature.", ex);
                }
        }

        private void handlePaymentIntentSucceeded(Event event) {
                PaymentIntent intent = getPaymentIntent(event);

                if (intent == null) {
                        log.warn("Stripe webhook {} did not contain a PaymentIntent", event.getId());
                        return;
                }

                if (!hasLocalPayment(intent, event)) {
                        return;
                }

                paymentService.markSucceeded(intent.getId(), intent.getLatestCharge());
                log.info("Marked Stripe PaymentIntent {} as succeeded from webhook {}", intent.getId(), event.getId());
        }

        private void handlePaymentIntentFailed(Event event) {
                PaymentIntent intent = getPaymentIntent(event);

                if (intent == null) {
                        log.warn("Stripe webhook {} did not contain a PaymentIntent", event.getId());
                        return;
                }

                if (!hasLocalPayment(intent, event)) {
                        return;
                }

                String failureCode = intent.getCancellationReason();
                String failureMessage = "Stripe payment status: " + intent.getStatus();

                if (intent.getLastPaymentError() != null) {
                        failureCode = intent.getLastPaymentError().getCode();
                        failureMessage = intent.getLastPaymentError().getMessage();
                }

                paymentService.markFailed(intent.getId(), failureCode, failureMessage);
                log.info("Marked Stripe PaymentIntent {} as failed from webhook {}", intent.getId(), event.getId());
        }

        private boolean hasLocalPayment(PaymentIntent intent, Event event) {
                boolean exists = paymentRepository.findByProviderPaymentIntentId(intent.getId()).isPresent();

                if (!exists) {
                        log.warn(
                                        "Ignoring Stripe webhook event {} for unknown PaymentIntent {}",
                                        event.getId(),
                                        intent.getId());
                }

                return exists;
        }

        private PaymentIntent getPaymentIntent(Event event) {
                var deserializer = event.getDataObjectDeserializer();

                return deserializer.getObject()
                                .or(() -> deserializeUnsafe(event))
                                .filter(PaymentIntent.class::isInstance)
                                .map(PaymentIntent.class::cast)
                                .orElse(null);
        }

        private java.util.Optional<StripeObject> deserializeUnsafe(Event event) {
                try {
                        return java.util.Optional.of(event.getDataObjectDeserializer().deserializeUnsafe());
                } catch (EventDataObjectDeserializationException ex) {
                        log.warn("Failed to deserialize Stripe webhook event {} data object", event.getId(), ex);
                        return java.util.Optional.empty();
                }
        }

        private long toMinorUnit(BigDecimal amount) {
                return amount
                                .multiply(BigDecimal.valueOf(100))
                                .setScale(0, RoundingMode.HALF_UP)
                                .longValueExact();
        }

        private UUID parseReservationToken(String reservationToken) {
                try {
                        return UUID.fromString(reservationToken);
                } catch (IllegalArgumentException exception) {
                        throw new IllegalArgumentException("Invalid reservation token.", exception);
                }
        }

        public Refund createRefund(String paymentIntentId, BigDecimal amount, String currency, String idempotencyKey) {
                try {
                        RefundCreateParams params = RefundCreateParams.builder()
                                        .setPaymentIntent(paymentIntentId)
                                        .setAmount(toMinorUnit(amount))
                                        .build();

                        RequestOptions options = RequestOptions.builder()
                                        .setIdempotencyKey(idempotencyKey)
                                        .build();

                        return Refund.create(params, options);
                } catch (Exception ex) {
                        log.error("Stripe refund creation failed for PaymentIntent {}", paymentIntentId, ex);
                        throw new IllegalStateException("Stripe refund creation failed");
                }
        }
}
