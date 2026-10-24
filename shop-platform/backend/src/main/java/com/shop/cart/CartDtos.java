package com.shop.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CartDtos {

    public record AddItemRequest(
            @NotNull Long productId,
            @NotNull @Min(1) Integer quantity) {
    }

    public record UpdateItemRequest(
            @NotNull @Min(0) Integer quantity) {
    }

    public record CartItemResponse(
            Long productId,
            String sku,
            String name,
            String imageUrl,
            Integer unitPricePaise,
            Integer quantity,
            Integer lineTotalPaise) {

        public static CartItemResponse from(CartItem item) {
            var p = item.getProduct();
            return new CartItemResponse(
                    p.getId(), p.getSku(), p.getName(), p.getImageUrl(),
                    p.getPricePaise(), item.getQuantity(),
                    p.getPricePaise() * item.getQuantity());
        }
    }

    public record CartResponse(
            List<CartItemResponse> items,
            Integer totalQuantity,
            Integer subtotalPaise,
            String couponCode,
            Integer discountPaise,
            Integer totalPaise) {

        public static CartResponse from(Cart cart) {
            return from(cart, null);
        }

        public static CartResponse from(Cart cart, com.shop.coupon.Coupon coupon) {
            int subtotal = cart.subtotalPaise();
            int discount = coupon == null ? 0 : coupon.discountFor(subtotal);

            return new CartResponse(
                    cart.getItems().stream()
                            .sorted((a, b) -> a.getProduct().getName().compareTo(b.getProduct().getName()))
                            .map(CartItemResponse::from)
                            .toList(),
                    cart.totalQuantity(),
                    subtotal,
                    coupon == null ? null : coupon.getCode(),
                    discount,
                    subtotal - discount);
        }
    }

    public record ApplyCouponRequest(@jakarta.validation.constraints.NotBlank String code) {
    }
}
