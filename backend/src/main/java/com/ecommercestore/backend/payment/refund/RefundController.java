package com.ecommercestore.backend.payment.refund;

import com.ecommercestore.backend.payment.refund.dto.RefundRequest;
import com.ecommercestore.backend.payment.refund.dto.RefundResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @PostMapping("/api/manager/orders/{orderId}/refunds/full")
    public RefundResponse refundOrder(
            @PathVariable("orderId") Long orderId,
            @Valid @RequestBody RefundRequest request) {
        return refundService.refundOrder(orderId, request.reason());
    }

    @PostMapping("/api/manager/orders/{orderId}/items/{orderItemId}/refund")
    public RefundResponse refundItem(
            @PathVariable("orderId") Long orderId,
            @PathVariable("orderItemId") Long orderItemId,
            @Valid @RequestBody RefundRequest request) {
        return refundService.refundItem(orderId, orderItemId, request.quantity(), request.reason());
    }

    @GetMapping("/api/manager/orders/{orderId}/refunds")
    public List<RefundResponse> getOrderRefunds(@PathVariable("orderId") Long orderId) {
        return refundService.getRefundsForOrder(orderId);
    }

    @GetMapping("/api/manager/payments/{paymentId}/refunds")
    public List<RefundResponse> getPaymentRefunds(@PathVariable("paymentId") UUID paymentId) {
        return refundService.getRefundsForPayment(paymentId);
    }
}
