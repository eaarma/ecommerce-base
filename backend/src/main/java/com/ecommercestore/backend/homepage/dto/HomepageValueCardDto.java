package com.ecommercestore.backend.homepage.dto;

import com.ecommercestore.backend.homepage.HomepageValueIconKey;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomepageValueCardDto {

    @Size(max = 180)
    private String title;

    @Size(max = 500)
    private String description;

    private HomepageValueIconKey iconKey;
}
