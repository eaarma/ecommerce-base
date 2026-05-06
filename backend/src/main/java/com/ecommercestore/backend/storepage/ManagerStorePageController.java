package com.ecommercestore.backend.storepage;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommercestore.backend.storepage.dto.StorePageResponse;
import com.ecommercestore.backend.storepage.dto.UpdateStorePageRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/manager/store/pages")
@RequiredArgsConstructor
public class ManagerStorePageController {

    private final StorePageService storePageService;

    @GetMapping
    public List<StorePageResponse> getStorePages() {
        return storePageService.getManagerPages();
    }

    @GetMapping("/{slug}")
    public StorePageResponse getStorePage(@PathVariable String slug) {
        return storePageService.getManagerPage(slug);
    }

    @PutMapping("/{slug}")
    public StorePageResponse updateStorePage(
            @PathVariable String slug,
            @Valid @RequestBody UpdateStorePageRequest request) {
        return storePageService.updatePage(slug, request);
    }
}
