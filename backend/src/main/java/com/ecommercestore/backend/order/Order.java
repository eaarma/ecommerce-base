package com.ecommercestore.backend.order;

import com.ecommercestore.backend.delivery.Delivery;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private UUID reservationToken;

    private Instant expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private String customerEmail;

    @Column(nullable = false)
    private String customerFirstName;

    @Column(nullable = false)
    private String customerLastName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingTotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private String currency;

    private Instant finalizedAt;

    private Instant paidAt;

    @Column(nullable = false)
    private boolean confirmationEmailSent;

    private Instant confirmationEmailSentAt;

    @Column(nullable = false)
    private boolean cancellationEmailSent;

    private Instant cancellationEmailSentAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Delivery delivery;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = OrderStatus.RESERVED;
        }

        if (currency == null) {
            currency = "EUR";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void clearItems() {
        items.forEach(item -> item.setOrder(null));
        items.clear();
    }

    public void setDelivery(Delivery delivery) {
        this.delivery = delivery;

        if (delivery != null) {
            delivery.setOrder(this);
        }
    }
}
