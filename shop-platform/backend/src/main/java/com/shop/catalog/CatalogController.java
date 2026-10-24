package com.shop.catalog;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Tag(name = "Catalog", description = "Product browsing, search and filtering")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/api/products")
    @Operation(summary = "Search and filter products")
    public CatalogDtos.ProductPageResponse list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return catalogService.search(search, category, page, size);
    }

    @GetMapping("/api/products/{id}")
    @Operation(summary = "Fetch a single product")
    public CatalogDtos.ProductResponse byId(@PathVariable Long id) {
        return catalogService.byId(id);
    }

    @GetMapping("/api/categories")
    @Operation(summary = "List distinct product categories")
    public List<String> categories() {
        return catalogService.categories();
    }
}
