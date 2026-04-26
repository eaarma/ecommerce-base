package com.ecommercestore.backend.payment;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommercestore.backend.order.OrderService;
import com.ecommercestore.backend.payment.dto.PaymentResponse;
import com.ecommercestore.backend.order.Order;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentMapper paymentMapper;
    private final OrderService orderService;

    @Transactional
    public PaymentResponse createPendingPayment(Long orderId, String reservationToken) {
        Order order = orderService.prepareOrderForPayment(orderId, reservationToken);

        Payment existingPendingPayment = paymentRepository
                .findFirstByOrderIdAndStatusOrderByCreatedAtDesc(orderId, PaymentStatus.PENDING)
                .orElse(null);

        if (existingPendingPayment != null) {
            return paymentMapper.toResponse(existingPendingPayment);
        }

        Payment payment = Payment.builder()
                .order(order)
                .provider(PaymentProvider.STRIPE)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotal())
                .currency(order.getCurrency())
                .build();

        Payment saved = paymentRepository.save(payment);

        return paymentMapper.toResponse(saved);
    }

    @Transactional
    public PaymentResponse markSucceeded(
            String providerPaymentIntentId,
            String providerChargeId) {
        Payment payment = paymentRepository.findByProviderPaymentIntentId(providerPaymentIntentId)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found"));

        if (payment.getStatus() == PaymentStatus.SUCCEEDED) {
            return paymentMapper.toResponse(payment);
        }

        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setProviderChargeId(providerChargeId);
        payment.setFailureCode(null);
        payment.setFailureMessage(null);
        payment.setPaidAt(Instant.now());

        orderService.markPaid(payment.getOrder().getId());

        return paymentMapper.toResponse(payment);
    }

    @Transactional
    public PaymentResponse markFailed(
            String providerPaymentIntentId,
            String failureCode,
            String failureMessage) {
        Payment payment = paymentRepository.findByProviderPaymentIntentId(providerPaymentIntentId)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found"));

        if (payment.getStatus() == PaymentStatus.SUCCEEDED) {
            return paymentMapper.toResponse(payment);
        }

        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureCode(failureCode);
        payment.setFailureMessage(failureMessage);

        Payment activePendingPayment = paymentRepository
                .findFirstByOrderIdAndStatusOrderByCreatedAtDesc(
                        payment.getOrder().getId(),
                        PaymentStatus.PENDING)
                .orElse(null);

        if (activePendingPayment != null
                && !activePendingPayment.getId().equals(payment.getId())) {
            return paymentMapper.toResponse(payment);
        }

        orderService.markPaymentFailed(payment.getOrder().getId());

        return paymentMapper.toResponse(payment);
    }

    @Transactional
    public Payment attachProviderPaymentIntentId(UUID paymentId, String providerPaymentIntentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found"));

        payment.setProviderPaymentIntentId(providerPaymentIntentId);

        return payment;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsForOrder(Long orderId) {
        return paymentRepository.findAllByOrderIdOrderByCreatedAtDesc(orderId)
                .stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found"));

        return paymentMapper.toResponse(payment);
    }

    @Transactional
    public Payment createOrReusePendingPaymentEntity(Long orderId, String reservationToken) {
        Order order = orderService.prepareOrderForPayment(orderId, reservationToken);

        return paymentRepository
                .findFirstByOrderIdAndStatusOrderByCreatedAtDesc(orderId, PaymentStatus.PENDING)
                .orElseGet(() -> paymentRepository.save(
                        Payment.builder()
                                .order(order)
                                .provider(PaymentProvider.STRIPE)
                                .status(PaymentStatus.PENDING)
                                .amount(order.getTotal())
                                .currency(order.getCurrency())
                                .build()));
    }

}
