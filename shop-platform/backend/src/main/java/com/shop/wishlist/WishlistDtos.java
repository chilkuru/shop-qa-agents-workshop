package com.shop.wishlist;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public class WishlistDtos {

    public record AddWishlistRequest(@NotNull Long productId) {
    }

    public record WishlistItemResponse(
            Long productId,
            String sku,
            String name,
            String category,
            String imageUrl,
            Integer pricePaise,
            Boolean inStock) {

        public static WishlistItemResponse from(WishlistItem item) {
            var p = item.getProduct();
            return new WishlistItemResponse(
                    p.getId(), p.getSku(), p.getName(), p.getCategory(),
                    p.getImageUrl(), p.getPricePaise(), p.getStock() > 0);
        }
    }

    public record WishlistResponse(List<WishlistItemResponse> items, Integer count) {

        public static WishlistResponse from(List<WishlistItem> items) {
            List<WishlistItemResponse> mapped = items.stream()
                    .map(WishlistItemResponse::from)
                    .toList();
            return new WishlistResponse(mapped, mapped.size());
        }
    }
}
