package com.ecommercestore.backend.order;

import com.ecommercestore.backend.delivery.DeliveryMapper;
import org.mapstruct.Mapper;

import com.ecommercestore.backend.order.dto.OrderResponse;

@Mapper(componentModel = "spring", uses = { OrderItemMapper.class, DeliveryMapper.class })
public interface OrderMapper {

    OrderResponse toResponse(Order order);
}
