package com.ecommercestore.backend.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEmailEventListener {

    private final EmailService emailService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderEmailRequested(OrderEmailRequestedEvent event) {
        try {
            switch (event.type()) {
                case CONFIRMATION -> emailService.sendOrderConfirmation(event.orderId());
                case CANCELLATION -> emailService.sendOrderCancellation(event.orderId(), event.cancellationReason());
                case ITEM_REFUND -> emailService.sendItemRefundNotification(event.refundId());
            }
        } catch (RuntimeException exception) {
            log.error(
                    "Failed to process {} email for order {}",
                    event.type(),
                    event.orderId(),
                    exception);
        }
    }
}
