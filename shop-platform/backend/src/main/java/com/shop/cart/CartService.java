package com.shop.cart;

import com.shop.catalog.Product;
import com.shop.catalog.ProductRepository;
import com.shop.common.ApiExceptions;
import com.shop.coupon.Coupon;
import com.shop.coupon.CouponService;
import com.shop.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class CartService {

    private final CartRepository carts;
    private final ProductRepository products;
    private final CouponService coupons;

    public CartService(CartRepository carts, ProductRepository products, CouponService coupons) {
        this.carts = carts;
        this.products = products;
        this.coupons = coupons;
    }

    @Transactional
    public Cart applyCoupon(User user, String code) {
        Cart cart = cartFor(user);
        Coupon coupon = coupons.validate(code, cart.subtotalPaise());
        cart.setCouponCode(coupon.getCode());
        return carts.save(cart);
    }

    @Transactional
    public Cart removeCoupon(User user) {
        Cart cart = cartFor(user);
        cart.setCouponCode(null);
        return carts.save(cart);
    }

    /** Resolves the cart's coupon, or null when none is applied. */
    @Transactional(readOnly = true)
    public Coupon couponFor(Cart cart) {
        return coupons.find(cart.getCouponCode());
    }

    @Transactional
    public Cart cartFor(User user) {
        return carts.findByUserId(user.getId())
                .orElseGet(() -> carts.save(Cart.builder().user(user).build()));
    }

    @Transactional
    public Cart addItem(User user, Long productId, int quantity) {
        Product product = products.findById(productId)
                .orElseThrow(() -> new ApiExceptions.NotFoundException("Product " + productId + " not found"));

        if (product.getStock() < quantity) {
            throw new ApiExceptions.BadRequestException(
                    "Only " + product.getStock() + " units of " + product.getName() + " are in stock");
        }

        Cart cart = cartFor(user);
        cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .ifPresentOrElse(
                        existing -> existing.setQuantity(existing.getQuantity() + quantity),
                        () -> cart.getItems().add(CartItem.builder()
                                .cart(cart)
                                .product(product)
                                .quantity(quantity)
                                .build()));

        cart.setUpdatedAt(Instant.now());
        return carts.save(cart);
    }

    /** Quantity 0 removes the line. */
    @Transactional
    public Cart updateItem(User user, Long productId, int quantity) {
        Cart cart = cartFor(user);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new ApiExceptions.NotFoundException("Product " + productId + " is not in the cart"));

        if (quantity == 0) {
            cart.getItems().remove(item);
        } else {
            if (item.getProduct().getStock() < quantity) {
                throw new ApiExceptions.BadRequestException(
                        "Only " + item.getProduct().getStock() + " units are in stock");
            }
            item.setQuantity(quantity);
        }

        cart.setUpdatedAt(Instant.now());
        return carts.save(cart);
    }

    @Transactional
    public Cart removeItem(User user, Long productId) {
        return updateItem(user, productId, 0);
    }

    @Transactional
    public Cart clear(User user) {
        Cart cart = cartFor(user);
        cart.getItems().clear();
        cart.setUpdatedAt(Instant.now());
        return carts.save(cart);
    }
}
