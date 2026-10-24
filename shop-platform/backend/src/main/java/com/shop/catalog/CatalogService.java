package com.shop.catalog;

import com.shop.common.ApiExceptions;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CatalogService {

    private final ProductRepository products;

    public CatalogService(ProductRepository products) {
        this.products = products;
    }

    public CatalogDtos.ProductPageResponse search(String search, String category, int page, int size) {
        String normalisedSearch = (search == null) ? "" : search.trim();
        String normalisedCategory = (category == null) ? "" : category.trim();

        Page<Product> result = products.search(
                normalisedSearch,
                normalisedCategory,
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), Sort.by("name").ascending()));

        return new CatalogDtos.ProductPageResponse(
                result.getContent().stream().map(CatalogDtos.ProductResponse::from).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    public CatalogDtos.ProductResponse byId(Long id) {
        return products.findById(id)
                .map(CatalogDtos.ProductResponse::from)
                .orElseThrow(() -> new ApiExceptions.NotFoundException("Product " + id + " not found"));
    }

    public List<String> categories() {
        return products.findDistinctCategories();
    }
}
