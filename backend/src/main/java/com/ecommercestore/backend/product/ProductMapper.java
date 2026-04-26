package com.ecommercestore.backend.product;

import org.mapstruct.*;

import com.ecommercestore.backend.product.dto.CreateProductRequest;
import com.ecommercestore.backend.product.dto.ProductResponse;
import com.ecommercestore.backend.product.dto.UpdateProductRequest;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    Product toEntity(CreateProductRequest request);

    ProductResponse toResponse(Product product);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(UpdateProductRequest request, @MappingTarget Product product);
}