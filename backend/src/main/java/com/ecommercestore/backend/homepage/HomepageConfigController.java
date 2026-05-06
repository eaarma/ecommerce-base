package com.ecommercestore.backend.homepage;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommercestore.backend.homepage.dto.HomepageConfigPublicResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/store/homepage")
@RequiredArgsConstructor
public class HomepageConfigController {

    private final HomepageConfigService homepageConfigService;

    @GetMapping
    public HomepageConfigPublicResponse getHomepageConfig() {
        return homepageConfigService.getPublicHomepageConfig();
    }
}
