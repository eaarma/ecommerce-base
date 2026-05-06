package com.ecommercestore.backend.email;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.mail.MailPreparationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.ecommercestore.backend.contact.dto.ContactMessageRequest;
import com.ecommercestore.backend.delivery.Delivery;
import com.ecommercestore.backend.delivery.DeliveryMethod;
import com.ecommercestore.backend.order.Order;
import com.ecommercestore.backend.order.OrderItem;
import com.ecommercestore.backend.order.OrderRepository;
import com.ecommercestore.backend.order.OrderStatus;
import com.ecommercestore.backend.payment.refund.Refund;
import com.ecommercestore.backend.payment.refund.RefundRepository;
import com.ecommercestore.backend.payment.refund.RefundStatus;
import com.ecommercestore.backend.shop.Shop;
import com.ecommercestore.backend.shop.ShopRepository;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter
            .ofPattern("dd MMM yyyy HH:mm z", Locale.ENGLISH)
            .withZone(ZoneId.systemDefault());

    private final JavaMailSender mailSender;
    private final OrderRepository orderRepository;
    private final RefundRepository refundRepository;
    private final ShopRepository shopRepository;
    private final EmailProperties emailProperties;

    @Transactional
    public void sendOrderConfirmation(Long orderId) {
        if (!emailProperties.isEnabled()) {
            log.info("Order confirmation email skipped for order {} because email sending is disabled", orderId);
            return;
        }

        Order order = loadOrder(orderId);

        if (order.isConfirmationEmailSent()) {
            log.info("Order confirmation email already sent for order {}", orderId);
            return;
        }

        if (order.getStatus() != OrderStatus.PAID
                && order.getStatus() != OrderStatus.PARTIALLY_REFUNDED
                && order.getStatus() != OrderStatus.REFUNDED
                && order.getStatus() != OrderStatus.CANCELLED_REFUNDED) {
            log.warn(
                    "Order {} is in status {} so confirmation email was not sent",
                    orderId,
                    order.getStatus());
            return;
        }

        String recipient = normalize(order.getCustomerEmail());

        if (recipient == null) {
            log.warn("Order {} has no customer email address, skipping confirmation email", orderId);
            return;
        }

        ShopEmailProfile shopProfile = resolveShopEmailProfile();

        try {
            sendEmail(
                    recipient,
                    "Order Confirmation #" + order.getId(),
                    buildConfirmationPlainText(order, shopProfile),
                    buildConfirmationHtml(order, shopProfile),
                    shopProfile.customerSupportEmail());
        } catch (MessagingException exception) {
            log.error("Failed to send confirmation email for order {}", orderId, exception);
            return;
        }

        order.setConfirmationEmailSent(true);
        order.setConfirmationEmailSentAt(Instant.now());
        log.info("Confirmation email sent for order {}", orderId);
    }

    public void sendContactMessage(ContactMessageRequest request) {
        if (!emailProperties.isEnabled()) {
            throw new MailPreparationException(
                    "Email sending is disabled. Configure SMTP credentials or set EMAIL_ENABLED=true.");
        }

        ShopEmailProfile shopProfile = resolveShopEmailProfile();
        String recipient = normalize(shopProfile.inboxEmail());

        if (recipient == null) {
            throw new MailPreparationException(
                    "Configure a contact receiver email in the store settings or provide CONTACT_RECEIVER/SMTP_USER before sending contact messages.");
        }

        Instant submittedAt = Instant.now();

        try {
            sendEmail(
                    recipient,
                    buildContactSubject(request.subject(), shopProfile.storeName()),
                    buildContactPlainText(request, submittedAt, shopProfile.storeName()),
                    buildContactHtml(request, submittedAt, shopProfile.storeName()),
                    request.email());
        } catch (MessagingException exception) {
            throw new MailPreparationException("Failed to prepare contact email.", exception);
        }

        log.info("Contact message forwarded from {}", normalize(request.email()));
    }

    @Transactional
    public void sendOrderCancellation(Long orderId, String cancellationReason) {
        if (!emailProperties.isEnabled()) {
            log.info("Order cancellation email skipped for order {} because email sending is disabled", orderId);
            return;
        }

        Order order = loadOrder(orderId);

        if (order.isCancellationEmailSent()) {
            log.info("Order cancellation email already sent for order {}", orderId);
            return;
        }

        if (order.getStatus() != OrderStatus.CANCELLED
                && order.getStatus() != OrderStatus.CANCELLED_REFUNDED) {
            log.warn(
                    "Order {} is in status {} so cancellation email was not sent",
                    orderId,
                    order.getStatus());
            return;
        }

        String recipient = normalize(order.getCustomerEmail());

        if (recipient == null) {
            log.warn("Order {} has no customer email address, skipping cancellation email", orderId);
            return;
        }

        ShopEmailProfile shopProfile = resolveShopEmailProfile();

        try {
            sendEmail(
                    recipient,
                    "Order Cancellation #" + order.getId(),
                    buildCancellationPlainText(order, cancellationReason, shopProfile),
                    buildCancellationHtml(order, cancellationReason, shopProfile),
                    shopProfile.customerSupportEmail());
        } catch (MessagingException exception) {
            log.error("Failed to send cancellation email for order {}", orderId, exception);
            return;
        }

        order.setCancellationEmailSent(true);
        order.setCancellationEmailSentAt(Instant.now());
        log.info("Cancellation email sent for order {}", orderId);
    }

    @Transactional
    public void sendItemRefundNotification(UUID refundId) {
        if (!emailProperties.isEnabled()) {
            log.info("Item refund email skipped for refund {} because email sending is disabled", refundId);
            return;
        }

        Refund refund = loadRefund(refundId);

        if (refund.getStatus() != RefundStatus.SUCCEEDED) {
            log.warn("Refund {} is in status {} so item refund email was not sent", refundId, refund.getStatus());
            return;
        }

        Order order = refund.getOrder();
        OrderItem orderItem = refund.getOrderItem();

        if (orderItem == null) {
            log.warn("Refund {} is not linked to an order item, skipping item refund email", refundId);
            return;
        }

        String recipient = normalize(order.getCustomerEmail());

        if (recipient == null) {
            log.warn("Order {} has no customer email address, skipping item refund email", order.getId());
            return;
        }

        ShopEmailProfile shopProfile = resolveShopEmailProfile();

        try {
            sendEmail(
                    recipient,
                    buildItemRefundSubject(order),
                    buildItemRefundPlainText(refund, shopProfile),
                    buildItemRefundHtml(refund, shopProfile),
                    shopProfile.customerSupportEmail());
        } catch (MessagingException exception) {
            log.error("Failed to send item refund email for refund {}", refundId, exception);
            return;
        }

        log.info("Item refund email sent for refund {}", refundId);
    }

    private Order loadOrder(Long orderId) {
        return orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));
    }

    private Refund loadRefund(UUID refundId) {
        if (refundId == null) {
            throw new IllegalArgumentException("Refund id is required.");
        }

        return refundRepository.findWithOrderDetailsById(refundId)
                .orElseThrow(() -> new IllegalArgumentException("Refund not found."));
    }

    private void sendEmail(
            String recipient,
            String subject,
            String plainText,
            String html,
            String replyTo) throws MessagingException {
        String from = normalize(emailProperties.getFrom());

        if (from == null) {
            throw new MailPreparationException("app.email.from or SMTP_USER must be configured before sending email.");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(recipient);
        String normalizedReplyTo = normalize(replyTo);
        if (normalizedReplyTo != null) {
            helper.setReplyTo(normalizedReplyTo);
        }
        helper.setSubject(subject);
        helper.setText(plainText, html);
        mailSender.send(message);
    }

    private String buildConfirmationPlainText(Order order, ShopEmailProfile shopProfile) {
        StringBuilder builder = new StringBuilder();
        builder.append("Hi ").append(getCustomerDisplayName(order)).append(",\n\n")
                .append("Thanks for your order. Your payment has been received and your order is confirmed.\n\n")
                .append(buildOrderSummaryText(order))
                .append("\n")
                .append(buildDeliverySummaryText(order))
                .append("\n")
                .append("Total paid: ").append(formatMoney(order.getTotal(), order.getCurrency())).append("\n\n")
                .append("We will send delivery updates as your order progresses.\n")
                .append(buildCustomerSupportPlainText(shopProfile))
                .append("Thank you,\n")
                .append(shopProfile.storeName());

        return builder.toString();
    }

    private String buildCancellationPlainText(Order order, String cancellationReason, ShopEmailProfile shopProfile) {
        StringBuilder builder = new StringBuilder();
        builder.append("Hi ").append(getCustomerDisplayName(order)).append(",\n\n")
                .append("Your order has been cancelled by our team.\n");

        String normalizedReason = normalize(cancellationReason);
        if (normalizedReason != null) {
            builder.append("Reason: ").append(normalizedReason).append("\n");
        }

        builder.append("\n")
                .append(buildOrderSummaryText(order))
                .append("\n")
                .append("If payment was captured, the refund is being sent back to the original payment method.\n\n")
                .append(buildCustomerSupportPlainText(shopProfile))
                .append("Thank you,\n")
                .append(shopProfile.storeName());

        return builder.toString();
    }

    private String buildContactPlainText(
            ContactMessageRequest request,
            Instant submittedAt,
            String storeName) {
        return """
                New contact message from the %s website.

                Name: %s
                Email: %s
                Subject: %s
                Submitted at: %s

                Message:
                %s
                """
                .formatted(
                        storeName,
                        request.name().trim(),
                        request.email().trim(),
                        safeSubject(request.subject()),
                        formatTimestamp(submittedAt),
                        request.message().trim());
    }

    private String buildItemRefundPlainText(Refund refund, ShopEmailProfile shopProfile) {
        Order order = refund.getOrder();
        OrderItem item = refund.getOrderItem();
        StringBuilder builder = new StringBuilder();

        builder.append("Hi ").append(getCustomerDisplayName(order)).append(",\n\n")
                .append("A refund has been issued for part of your order.\n\n")
                .append("Order #").append(order.getId()).append("\n")
                .append("Item: ").append(item.getProductSnapshotName()).append("\n")
                .append("Refunded quantity: ").append(formatRefundQuantity(refund)).append("\n")
                .append("Refund amount: ").append(formatMoney(refund.getAmount(), refund.getCurrency())).append("\n");

        String reason = normalize(refund.getReason());
        if (reason != null) {
            builder.append("Reason: ").append(reason).append("\n");
        }

        Instant refundedAt = refund.getSucceededAt() != null ? refund.getSucceededAt() : refund.getCreatedAt();
        if (refundedAt != null) {
            builder.append("Refunded at: ").append(formatTimestamp(refundedAt)).append("\n");
        }

        builder.append("\n")
                .append(buildRefundNextStepText(order))
                .append("\n")
                .append(buildCustomerSupportPlainText(shopProfile))
                .append("Thank you,\n")
                .append(shopProfile.storeName());

        return builder.toString();
    }

    private String buildConfirmationHtml(Order order, ShopEmailProfile shopProfile) {
        return """
                <html>
                <body style="margin:0;padding:0;background-color:#f6f7fb;font-family:Arial,sans-serif;color:#1f2937;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
                        <tr>
                            <td align="center">
                                <table width="640" cellpadding="0" cellspacing="0" style="width:100%%;max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
                                    <tr>
                                        <td>
                                            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;">%s</p>
                                            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;">Order Confirmation #%d</h1>
                                            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
                                                Hi <strong>%s</strong>, your payment has been received and your order is confirmed.
                                            </p>
                                            %s
                                            %s
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#f9fafb;border-radius:10px;">
                                                <tr>
                                                    <td style="padding:18px 20px;">
                                                        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Total paid</p>
                                                        <p style="margin:0;font-size:24px;font-weight:bold;color:#111827;">%s</p>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#4b5563;">
                                                We will send delivery updates as your order progresses.
                                            </p>
                                            %s
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """
                .formatted(
                        escapeHtml(shopProfile.storeName()),
                        order.getId(),
                        escapeHtml(getCustomerDisplayName(order)),
                        buildItemsHtml(order),
                        buildDeliveryHtml(order),
                        escapeHtml(formatMoney(order.getTotal(), order.getCurrency())),
                        buildCustomerSupportHtml(shopProfile));
    }

    private String buildCancellationHtml(Order order, String cancellationReason, ShopEmailProfile shopProfile) {
        String normalizedReason = normalize(cancellationReason);
        String reasonHtml = normalizedReason == null
                ? ""
                : """
                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;">
                            <tr>
                                <td style="padding:16px 20px;">
                                    <p style="margin:0 0 6px;font-size:13px;color:#991b1b;">Cancellation reason</p>
                                    <p style="margin:0;font-size:15px;line-height:1.6;color:#7f1d1d;">%s</p>
                                </td>
                            </tr>
                        </table>
                        """
                        .formatted(escapeHtml(normalizedReason));

        return """
                <html>
                <body style="margin:0;padding:0;background-color:#f6f7fb;font-family:Arial,sans-serif;color:#1f2937;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
                        <tr>
                            <td align="center">
                                <table width="640" cellpadding="0" cellspacing="0" style="width:100%%;max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
                                    <tr>
                                        <td>
                                            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#dc2626;">%s</p>
                                            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;">Order Cancellation #%d</h1>
                                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                                                Hi <strong>%s</strong>, your order has been cancelled by our team.
                                            </p>
                                            %s
                                            %s
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#fff7ed;border-radius:10px;">
                                                <tr>
                                                    <td style="padding:18px 20px;">
                                                        <p style="margin:0;font-size:14px;line-height:1.7;color:#9a3412;">
                                                            If payment was captured, the refund is being returned to the original payment method.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#4b5563;">
                                                %s
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """
                .formatted(
                        escapeHtml(shopProfile.storeName()),
                        order.getId(),
                        escapeHtml(getCustomerDisplayName(order)),
                        reasonHtml,
                        buildItemsHtml(order),
                        buildCustomerSupportHtmlText(shopProfile));
    }

    private String buildContactHtml(
            ContactMessageRequest request,
            Instant submittedAt,
            String storeName) {
        return """
                <html>
                <body style="margin:0;padding:0;background-color:#f6f7fb;font-family:Arial,sans-serif;color:#1f2937;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
                        <tr>
                            <td align="center">
                                <table width="640" cellpadding="0" cellspacing="0" style="width:100%%;max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
                                    <tr>
                                        <td>
                                            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;">%s</p>
                                            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;">New Contact Message</h1>
                                            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                                                A new message was submitted through the website contact form.
                                            </p>
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#f9fafb;border-radius:10px;">
                                                <tr>
                                                    <td style="padding:18px 20px;">
                                                        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#374151;"><strong>Name:</strong> %s</p>
                                                        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#374151;"><strong>Email:</strong> %s</p>
                                                        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#374151;"><strong>Subject:</strong> %s</p>
                                                        <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;"><strong>Submitted at:</strong> %s</p>
                                                    </td>
                                                </tr>
                                            </table>
                                            <div style="padding:20px;border:1px solid #e5e7eb;border-radius:10px;background:#ffffff;">
                                                <p style="margin:0 0 10px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
                                                <p style="margin:0;font-size:15px;line-height:1.7;color:#111827;">%s</p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """
                .formatted(
                        escapeHtml(storeName),
                        escapeHtml(request.name().trim()),
                        escapeHtml(request.email().trim()),
                        escapeHtml(safeSubject(request.subject())),
                        escapeHtml(formatTimestamp(submittedAt)),
                        escapeHtmlWithLineBreaks(request.message().trim()));
    }

    private String buildItemRefundHtml(Refund refund, ShopEmailProfile shopProfile) {
        Order order = refund.getOrder();
        OrderItem item = refund.getOrderItem();
        String reason = normalize(refund.getReason());
        Instant refundedAt = refund.getSucceededAt() != null ? refund.getSucceededAt() : refund.getCreatedAt();

        String reasonHtml = reason == null
                ? ""
                : """
                        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#374151;"><strong>Reason:</strong> %s</p>
                        """
                        .formatted(escapeHtml(reason));

        String refundedAtHtml = refundedAt == null
                ? ""
                : """
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;"><strong>Refunded at:</strong> %s</p>
                        """
                        .formatted(escapeHtml(formatTimestamp(refundedAt)));

        return """
                <html>
                <body style="margin:0;padding:0;background-color:#f6f7fb;font-family:Arial,sans-serif;color:#1f2937;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
                        <tr>
                            <td align="center">
                                <table width="640" cellpadding="0" cellspacing="0" style="width:100%%;max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
                                    <tr>
                                        <td>
                                            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#d97706;">%s</p>
                                            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;">Refund Update for Order #%d</h1>
                                            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                                                Hi <strong>%s</strong>, a refund has been issued for part of your order.
                                            </p>
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#f9fafb;border-radius:10px;">
                                                <tr>
                                                    <td style="padding:18px 20px;">
                                                        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#374151;"><strong>Item:</strong> %s</p>
                                                        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#374151;"><strong>Refunded quantity:</strong> %s</p>
                                                        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#374151;"><strong>Refund amount:</strong> %s</p>
                                                        %s
                                                        %s
                                                    </td>
                                                </tr>
                                            </table>
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#fff7ed;border-radius:10px;">
                                                <tr>
                                                    <td style="padding:18px 20px;">
                                                        <p style="margin:0;font-size:14px;line-height:1.7;color:#9a3412;">
                                                            %s
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#4b5563;">
                                                %s
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """
                .formatted(
                        escapeHtml(shopProfile.storeName()),
                        order.getId(),
                        escapeHtml(getCustomerDisplayName(order)),
                        escapeHtml(item.getProductSnapshotName()),
                        escapeHtml(formatRefundQuantity(refund)),
                        escapeHtml(formatMoney(refund.getAmount(), refund.getCurrency())),
                        reasonHtml,
                        refundedAtHtml,
                        escapeHtml(buildRefundNextStepText(order)),
                        buildCustomerSupportHtmlText(shopProfile));
    }

    private String buildItemsHtml(Order order) {
        String rows = order.getItems()
                .stream()
                .map(this::buildItemRowHtml)
                .reduce("", String::concat);

        return """
                <table width="100%%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                    <tr style="background:#f9fafb;">
                        <th align="left" style="padding:14px 16px;font-size:12px;text-transform:uppercase;color:#6b7280;">Item</th>
                        <th align="center" style="padding:14px 16px;font-size:12px;text-transform:uppercase;color:#6b7280;">Qty</th>
                        <th align="right" style="padding:14px 16px;font-size:12px;text-transform:uppercase;color:#6b7280;">Line total</th>
                    </tr>
                    %s
                </table>
                """
                .formatted(rows);
    }

    private String buildItemRowHtml(OrderItem item) {
        String variantLine = normalize(item.getVariantSnapshotLabel());
        String variantHtml = variantLine == null || "Default".equalsIgnoreCase(variantLine)
                ? ""
                : """
                        <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Variant: %s</p>
                        """.formatted(escapeHtml(variantLine));

        return """
                <tr>
                    <td style="padding:16px;border-top:1px solid #e5e7eb;">
                        <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">%s</p>
                        %s
                        <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Unit price: %s</p>
                    </td>
                    <td align="center" style="padding:16px;border-top:1px solid #e5e7eb;font-size:14px;color:#374151;">%d</td>
                    <td align="right" style="padding:16px;border-top:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#111827;">%s</td>
                </tr>
                """
                .formatted(
                        escapeHtml(item.getProductSnapshotName()),
                        variantHtml,
                        escapeHtml(formatMoney(item.getUnitPrice(), item.getOrder().getCurrency())),
                        item.getQuantity(),
                        escapeHtml(formatMoney(item.getLineTotal(), item.getOrder().getCurrency())));
    }

    private String buildDeliveryHtml(Order order) {
        Delivery delivery = order.getDelivery();

        if (delivery == null) {
            return "";
        }

        return """
                <table width="100%%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#f9fafb;border-radius:10px;">
                    <tr>
                        <td style="padding:18px 20px;">
                            <p style="margin:0 0 10px;font-size:13px;color:#6b7280;">Delivery details</p>
                            %s
                        </td>
                    </tr>
                </table>
                """
                .formatted(toParagraphs(buildDeliveryLines(delivery)));
    }

    private String buildOrderSummaryText(Order order) {
        StringBuilder builder = new StringBuilder();
        builder.append("Order #").append(order.getId()).append("\n");

        for (OrderItem item : order.getItems()) {
            builder.append("- ")
                    .append(item.getProductSnapshotName())
                    .append(" x")
                    .append(item.getQuantity())
                    .append(" (")
                    .append(formatMoney(item.getLineTotal(), order.getCurrency()))
                    .append(")\n");
        }

        builder.append("Subtotal: ").append(formatMoney(order.getSubtotal(), order.getCurrency())).append("\n")
                .append("Shipping: ").append(formatMoney(order.getShippingTotal(), order.getCurrency())).append("\n")
                .append("Order total: ").append(formatMoney(order.getTotal(), order.getCurrency())).append("\n");

        if (order.getPaidAt() != null) {
            builder.append("Paid at: ").append(formatTimestamp(order.getPaidAt())).append("\n");
        }

        return builder.toString();
    }

    private String buildDeliverySummaryText(Order order) {
        Delivery delivery = order.getDelivery();

        if (delivery == null) {
            return "";
        }

        StringBuilder builder = new StringBuilder("Delivery details:\n");
        buildDeliveryLines(delivery).forEach(line -> builder.append("- ").append(line).append("\n"));
        return builder.toString();
    }

    private List<String> buildDeliveryLines(Delivery delivery) {
        List<String> lines = new ArrayList<>();
        lines.add("Method: " + formatDeliveryMethod(delivery.getMethod()));
        lines.add("Recipient: " + safeValue(delivery.getRecipientName()));
        lines.add("Email: " + safeValue(delivery.getRecipientEmail()));

        String phone = normalize(delivery.getRecipientPhone());
        if (phone != null) {
            lines.add("Phone: " + phone);
        }

        if (delivery.getMethod() == DeliveryMethod.PARCEL_LOCKER) {
            appendIfPresent(lines, "Parcel locker: ", delivery.getParcelLockerName());
            appendIfPresent(lines, "Locker address: ", delivery.getParcelLockerAddress());
        } else {
            appendIfPresent(lines, "Address: ", delivery.getAddressLine1());
            appendIfPresent(lines, "Address 2: ", delivery.getAddressLine2());

            String cityPostal = joinWithComma(
                    normalize(delivery.getCity()),
                    normalize(delivery.getPostalCode()));
            if (cityPostal != null) {
                lines.add("City / postal code: " + cityPostal);
            }

            appendIfPresent(lines, "Country: ", delivery.getCountry());
        }

        return lines;
    }

    private void appendIfPresent(List<String> lines, String label, String value) {
        String normalized = normalize(value);
        if (normalized != null) {
            lines.add(label + normalized);
        }
    }

    private String joinWithComma(String left, String right) {
        if (left == null && right == null) {
            return null;
        }

        if (left == null) {
            return right;
        }

        if (right == null) {
            return left;
        }

        return left + ", " + right;
    }

    private String formatDeliveryMethod(DeliveryMethod method) {
        return switch (method) {
            case PARCEL_LOCKER -> "Parcel locker";
            case POSTAL_DELIVERY -> "Postal delivery";
        };
    }

    private String toParagraphs(List<String> lines) {
        return lines.stream()
                .map(line -> """
                        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#374151;">%s</p>
                        """.formatted(escapeHtml(line)))
                .reduce("", String::concat);
    }

    private String formatMoney(BigDecimal amount, String currency) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString() + " " + currency;
    }

    private String formatTimestamp(Instant instant) {
        return TIMESTAMP_FORMATTER.format(instant);
    }

    private String buildItemRefundSubject(Order order) {
        return "Refund Update for Order #" + order.getId();
    }

    private String buildRefundNextStepText(Order order) {
        if (order.getStatus() == OrderStatus.REFUNDED || order.getStatus() == OrderStatus.CANCELLED_REFUNDED) {
            return "This refund completes the order, and no further shipment will be sent.";
        }

        return "Any remaining items in your order will continue through fulfillment as normal.";
    }

    private String buildContactSubject(String subject, String storeName) {
        String normalizedSubject = normalize(subject);
        if (normalizedSubject == null) {
            return storeName + " Contact Message";
        }

        return storeName + " Contact: " + normalizedSubject;
    }

    private String getCustomerDisplayName(Order order) {
        String firstName = normalize(order.getCustomerFirstName());
        String lastName = normalize(order.getCustomerLastName());
        String fullName = joinWithSpace(firstName, lastName);

        return fullName != null ? fullName : "Customer";
    }

    private String joinWithSpace(String left, String right) {
        if (left == null && right == null) {
            return null;
        }

        if (left == null) {
            return right;
        }

        if (right == null) {
            return left;
        }

        return left + " " + right;
    }

    private String safeValue(String value) {
        String normalized = normalize(value);
        return normalized != null ? normalized : "N/A";
    }

    private String safeSubject(String subject) {
        String normalized = normalize(subject);
        return normalized != null ? normalized : "No subject provided";
    }

    private String formatRefundQuantity(Refund refund) {
        Integer quantity = refund.getQuantity();
        return quantity != null ? quantity.toString() : "1";
    }

    private ShopEmailProfile resolveShopEmailProfile() {
        Shop shop = shopRepository.findById(1L)
                .or(() -> shopRepository.findFirstByOrderByIdAsc())
                .orElse(null);

        String storeName = normalize(shop != null ? shop.getStoreName() : null);
        if (storeName == null) {
            storeName = normalize(emailProperties.getStoreName());
        }
        if (storeName == null) {
            storeName = "Ecommerce Store";
        }

        String supportEmail = normalize(shop != null ? shop.getSupportEmail() : null);
        String contactEmail = normalize(shop != null ? shop.getContactEmail() : null);
        String receiverEmail = normalize(shop != null ? shop.getContactReceiverEmail() : null);
        String customerSupportEmail = supportEmail != null ? supportEmail : contactEmail;
        String inboxEmail = receiverEmail != null
                ? receiverEmail
                : normalize(emailProperties.getContactReceiver());

        if (inboxEmail == null) {
            inboxEmail = customerSupportEmail;
        }

        return new ShopEmailProfile(storeName, customerSupportEmail, inboxEmail);
    }

    private String buildCustomerSupportPlainText(ShopEmailProfile shopProfile) {
        String supportEmail = normalize(shopProfile.customerSupportEmail());
        if (supportEmail == null) {
            return "If you have any questions, reply to this email.\n";
        }

        return "If you have any questions, contact " + supportEmail + ".\n";
    }

    private String buildCustomerSupportHtml(ShopEmailProfile shopProfile) {
        return """
                <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#4b5563;">
                    %s
                </p>
                """
                .formatted(buildCustomerSupportHtmlText(shopProfile));
    }

    private String buildCustomerSupportHtmlText(ShopEmailProfile shopProfile) {
        String supportEmail = normalize(shopProfile.customerSupportEmail());
        if (supportEmail == null) {
            return "If you have any questions, reply to this email and we will help.";
        }

        return "If you have any questions, contact <a href=\"mailto:" + escapeHtml(supportEmail)
                + "\" style=\"color:#2563eb;text-decoration:none;\">" + escapeHtml(supportEmail)
                + "</a> and we will help.";
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String escapeHtmlWithLineBreaks(String value) {
        return escapeHtml(value)
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .replace("\n", "<br/>");
    }

    private record ShopEmailProfile(
            String storeName,
            String customerSupportEmail,
            String inboxEmail) {
    }
}
