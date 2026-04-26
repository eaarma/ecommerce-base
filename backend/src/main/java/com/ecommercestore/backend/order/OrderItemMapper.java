package com.ecommercestore.backend.order;

import org.mapstruct.Mapper;

import com.ecommercestore.backend.order.dto.OrderItemResponse;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {

    OrderItemResponse toResponse(OrderItem item);
}
