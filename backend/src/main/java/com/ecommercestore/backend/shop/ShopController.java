package com.ecommercestore.backend.shop;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommercestore.backend.shop.dto.ShopPublicResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/store/shop")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    @GetMapping
    public ShopPublicResponse getShop() {
        return shopService.getPublicShop();
    }
}
