package com.ecommercestore.backend.payment;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.ecommercestore.backend.payment.dto.PaymentResponse;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(source = "order.id", target = "orderId")
    PaymentResponse toResponse(Payment payment);
}