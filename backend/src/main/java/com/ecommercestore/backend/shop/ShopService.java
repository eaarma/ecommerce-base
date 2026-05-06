package com.ecommercestore.backend.shop;

import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommercestore.backend.shop.dto.ShopPublicResponse;
import com.ecommercestore.backend.shop.dto.ShopResponse;
import com.ecommercestore.backend.shop.dto.UpdateShopRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShopService {

    private static final Long DEFAULT_SHOP_ID = 1L;

    private final ShopRepository shopRepository;
    private final ShopMapper shopMapper;

    public ShopPublicResponse getPublicShop() {
        return shopMapper.toPublicResponse(findDefaultShop());
    }

    public ShopResponse getManagerShop() {
        return shopMapper.toResponse(findDefaultShop());
    }

    @Transactional
    public ShopResponse updateShop(UpdateShopRequest request) {
        Shop shop = findDefaultShop();
        shopMapper.updateEntity(request, shop);

        Shop savedShop = shopRepository.save(shop);
        return shopMapper.toResponse(savedShop);
    }

    private Shop findDefaultShop() {
        return shopRepository.findById(DEFAULT_SHOP_ID)
                .or(() -> shopRepository.findFirstByOrderByIdAsc())
                .orElseThrow(() -> new NoSuchElementException(
                        "Shop configuration has not been initialized."));
    }
}
