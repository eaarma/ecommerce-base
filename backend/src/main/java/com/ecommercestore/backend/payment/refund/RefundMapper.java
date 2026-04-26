package com.ecommercestore.backend.payment.refund;

import com.ecommercestore.backend.payment.refund.dto.RefundResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RefundMapper {

    @Mapping(source = "payment.id", target = "paymentId")
    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "orderItem.id", target = "orderItemId")
    RefundResponse toResponse(Refund refund);
}
