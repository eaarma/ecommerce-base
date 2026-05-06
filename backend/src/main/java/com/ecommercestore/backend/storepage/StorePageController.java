package com.ecommercestore.backend.storepage;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommercestore.backend.storepage.dto.StorePagePublicResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/store/pages")
@RequiredArgsConstructor
public class StorePageController {

    private final StorePageService storePageService;

    @GetMapping("/{slug}")
    public StorePagePublicResponse getStorePage(@PathVariable String slug) {
        return storePageService.getPublicPage(slug);
    }
}
