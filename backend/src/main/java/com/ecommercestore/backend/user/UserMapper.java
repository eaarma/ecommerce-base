package com.ecommercestore.backend.user;

import com.ecommercestore.backend.user.dto.CreateUserRequest;
import com.ecommercestore.backend.user.dto.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "email", expression = "java(normalizeEmail(request.getEmail()))")
    @Mapping(target = "status", expression = "java(request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE)")
    User toEntity(CreateUserRequest request);

    UserResponse toResponse(User user);

    default String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}