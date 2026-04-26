package com.ecommercestore.backend.auth.dto;

import com.ecommercestore.backend.user.Role;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String accessToken;
    private String tokenType;
    private String email;
    private String name;
    private Role role;
}