package com.ecommercestore.backend.delivery;

import com.ecommercestore.backend.delivery.dto.DeliveryResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DeliveryMapper {

    DeliveryResponse toResponse(Delivery delivery);
}
