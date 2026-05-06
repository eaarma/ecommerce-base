package com.ecommercestore.backend.homepage;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommercestore.backend.homepage.dto.HomepageConfigResponse;
import com.ecommercestore.backend.homepage.dto.UpdateHomepageConfigRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/manager/store/homepage")
@RequiredArgsConstructor
public class ManagerHomepageConfigController {

    private final HomepageConfigService homepageConfigService;

    @GetMapping
    public HomepageConfigResponse getHomepageConfig() {
        return homepageConfigService.getManagerHomepageConfig();
    }

    @PutMapping
    public HomepageConfigResponse updateHomepageConfig(@Valid @RequestBody UpdateHomepageConfigRequest request) {
        return homepageConfigService.updateHomepageConfig(request);
    }
}
