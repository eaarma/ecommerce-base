package com.ecommercestore.backend.storepage;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.ecommercestore.backend.storepage.dto.StorePagePublicResponse;
import com.ecommercestore.backend.storepage.dto.StorePageResponse;
import com.ecommercestore.backend.storepage.dto.UpdateStorePageRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

@Component
public class StorePageMapper {

    private static final ObjectMapper OBJECT_MAPPER = JsonMapper.builder()
            .findAndAddModules()
            .build();

    public StorePagePublicResponse toPublicResponse(StorePage page) {
        return StorePagePublicResponse.builder()
                .slug(page.getSlug())
                .title(page.getTitle())
                .description(page.getDescription())
                .contentJson(readJsonObject(page.getContentJson()))
                .closingNote(page.getClosingNote())
                .build();
    }

    public StorePageResponse toResponse(StorePage page) {
        return StorePageResponse.builder()
                .id(page.getId())
                .slug(page.getSlug())
                .title(page.getTitle())
                .description(page.getDescription())
                .contentJson(readJsonObject(page.getContentJson()))
                .closingNote(page.getClosingNote())
                .status(page.getStatus())
                .createdAt(page.getCreatedAt())
                .updatedAt(page.getUpdatedAt())
                .build();
    }

    public void updateEntity(UpdateStorePageRequest request, StorePage page) {
        page.setTitle(normalizeRequired(request.getTitle(), "Title"));
        page.setDescription(normalizeOptional(request.getDescription()));
        page.setContentJson(writeJson(normalizeContentJson(request.getContentJson())));
        page.setClosingNote(normalizeOptional(request.getClosingNote()));
        page.setStatus(request.getStatus() != null ? request.getStatus() : page.getStatus());
    }

    private JsonNode readJsonObject(String value) {
        String payload = StringUtils.hasText(value) ? value.trim() : "{}";

        try {
            JsonNode jsonNode = OBJECT_MAPPER.readTree(payload);

            if (jsonNode == null || jsonNode.isNull()) {
                return OBJECT_MAPPER.createObjectNode();
            }

            if (!jsonNode.isObject()) {
                throw new IllegalStateException("Stored page content must be a JSON object.");
            }

            return jsonNode.deepCopy();
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored store page content is invalid JSON.", exception);
        }
    }

    private String writeJson(JsonNode value) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize store page content.", exception);
        }
    }

    private JsonNode normalizeContentJson(Object value) {
        if (value == null) {
            return OBJECT_MAPPER.createObjectNode();
        }

        JsonNode normalized = OBJECT_MAPPER.valueToTree(value);

        if (normalized == null || normalized.isNull()) {
            return OBJECT_MAPPER.createObjectNode();
        }

        if (!normalized.isObject()) {
            throw new IllegalArgumentException("Content JSON must be a JSON object.");
        }

        return normalized.deepCopy();
    }

    private String normalizeRequired(String value, String fieldLabel) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new IllegalArgumentException(fieldLabel + " is required.");
        }

        return normalized;
    }

    private String normalizeOptional(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.trim();
    }
}
