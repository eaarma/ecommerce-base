package com.ecommercestore.backend.order;

import org.mapstruct.Mapper;

import com.ecommercestore.backend.order.dto.OrderResponse;

@Mapper(componentModel = "spring", uses = OrderItemMapper.class)
public interface OrderMapper {

    OrderResponse toResponse(Order order);
}
