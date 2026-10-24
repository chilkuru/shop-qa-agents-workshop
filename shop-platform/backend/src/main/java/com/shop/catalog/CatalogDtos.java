package com.shop.catalog;

import java.util.List;

public class CatalogDtos {

    public record ProductResponse(
            Long id,
            String sku,
            String name,
            String description,
            String category,
            Integer pricePaise,
            String imageUrl,
            Integer stock,
            boolean inStock) {

        public static ProductResponse from(Product p) {
            return new ProductResponse(
                    p.getId(), p.getSku(), p.getName(), p.getDescription(), p.getCategory(),
                    p.getPricePaise(), p.getImageUrl(), p.getStock(), p.getStock() > 0);
        }
    }

    public record ProductPageResponse(
            List<ProductResponse> items,
            int page,
            int size,
            long totalItems,
            int totalPages) {
    }
}
