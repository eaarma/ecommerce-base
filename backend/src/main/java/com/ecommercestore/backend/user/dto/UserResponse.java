package com.ecommercestore.backend.user.dto;

import com.ecommercestore.backend.user.Role;
import com.ecommercestore.backend.user.UserStatus;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private UUID id;
    private String email;
    private String name;
    private Role role;
    private UserStatus status;
    private Instant createdAt;
}