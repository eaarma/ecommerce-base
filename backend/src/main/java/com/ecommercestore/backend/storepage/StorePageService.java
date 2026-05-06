package com.ecommercestore.backend.storepage;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommercestore.backend.storepage.dto.StorePagePublicResponse;
import com.ecommercestore.backend.storepage.dto.StorePageResponse;
import com.ecommercestore.backend.storepage.dto.UpdateStorePageRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StorePageService {

    private final StorePageRepository storePageRepository;
    private final StorePageMapper storePageMapper;

    public StorePagePublicResponse getPublicPage(String slug) {
        String normalizedSlug = normalizeSlug(slug);

        StorePage page = storePageRepository.findBySlugAndStatus(normalizedSlug, StorePageStatus.PUBLISHED)
                .orElseThrow(() -> new NoSuchElementException(
                        "Published store page not found for slug '" + normalizedSlug + "'."));

        return storePageMapper.toPublicResponse(page);
    }

    public List<StorePageResponse> getManagerPages() {
        return storePageRepository.findAllByOrderByIdAsc().stream()
                .map(storePageMapper::toResponse)
                .toList();
    }

    public StorePageResponse getManagerPage(String slug) {
        return storePageMapper.toResponse(findPageBySlug(slug));
    }

    @Transactional
    public StorePageResponse updatePage(String slug, UpdateStorePageRequest request) {
        StorePage page = findPageBySlug(slug);
        storePageMapper.updateEntity(request, page);

        StorePage savedPage = storePageRepository.save(page);
        return storePageMapper.toResponse(savedPage);
    }

    private StorePage findPageBySlug(String slug) {
        String normalizedSlug = normalizeSlug(slug);

        return storePageRepository.findBySlug(normalizedSlug)
                .orElseThrow(() -> new NoSuchElementException(
                        "Store page not found for slug '" + normalizedSlug + "'."));
    }

    private String normalizeSlug(String slug) {
        return StorePageSlug.fromValue(slug).getValue();
    }
}
