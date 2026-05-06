package com.ecommercestore.backend.storepage.dto;

import java.time.Instant;

import com.ecommercestore.backend.storepage.StorePageStatus;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorePageResponse {

    private Long id;
    private String slug;
    private String title;
    private String description;
    private JsonNode contentJson;
    private String closingNote;
    private StorePageStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
