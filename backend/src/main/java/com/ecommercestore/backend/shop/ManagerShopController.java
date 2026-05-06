package com.ecommercestore.backend.shop;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommercestore.backend.shop.dto.ShopResponse;
import com.ecommercestore.backend.shop.dto.UpdateShopRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/manager/store/shop")
@RequiredArgsConstructor
public class ManagerShopController {

    private final ShopService shopService;

    @GetMapping
    public ShopResponse getShop() {
        return shopService.getManagerShop();
    }

    @PutMapping
    public ShopResponse updateShop(@Valid @RequestBody UpdateShopRequest request) {
        return shopService.updateShop(request);
    }
}
