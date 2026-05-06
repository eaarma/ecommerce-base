package com.ecommercestore.backend.storepage.dto;

import com.ecommercestore.backend.storepage.StorePageStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateStorePageRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 1000)
    private String description;

    private Object contentJson;

    @Size(max = 4000)
    private String closingNote;

    private StorePageStatus status;
}
