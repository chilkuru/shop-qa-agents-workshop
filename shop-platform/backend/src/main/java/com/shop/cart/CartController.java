package com.shop.cart;

import com.shop.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@Tag(name = "Cart", description = "Per-user shopping cart")
public class CartController {

    private final CartService cartService;
    private final AuthService authService;

    public CartController(CartService cartService, AuthService authService) {
        this.cartService = cartService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Fetch the current user's cart")
    public CartDtos.CartResponse get() {
        return respond(cartService.cartFor(authService.currentUser()));
    }

    @PostMapping("/items")
    @Operation(summary = "Add a product to the cart")
    public CartDtos.CartResponse addItem(@Valid @RequestBody CartDtos.AddItemRequest request) {
        return respond(
                cartService.addItem(authService.currentUser(), request.productId(), request.quantity()));
    }

    @PatchMapping("/items/{productId}")
    @Operation(summary = "Change a line quantity; 0 removes the line")
    public CartDtos.CartResponse updateItem(@PathVariable Long productId,
                                            @Valid @RequestBody CartDtos.UpdateItemRequest request) {
        return respond(
                cartService.updateItem(authService.currentUser(), productId, request.quantity()));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove a product from the cart")
    public CartDtos.CartResponse removeItem(@PathVariable Long productId) {
        return respond(cartService.removeItem(authService.currentUser(), productId));
    }

    @PostMapping("/coupon")
    @Operation(summary = "Apply a discount coupon to the cart")
    public CartDtos.CartResponse applyCoupon(@Valid @RequestBody CartDtos.ApplyCouponRequest request) {
        return respond(cartService.applyCoupon(authService.currentUser(), request.code()));
    }

    @DeleteMapping("/coupon")
    @Operation(summary = "Remove the applied coupon")
    public CartDtos.CartResponse removeCoupon() {
        return respond(cartService.removeCoupon(authService.currentUser()));
    }

    @DeleteMapping
    @Operation(summary = "Empty the cart")
    public CartDtos.CartResponse clear() {
        return respond(cartService.clear(authService.currentUser()));
    }

    private CartDtos.CartResponse respond(Cart cart) {
        return CartDtos.CartResponse.from(cart, cartService.couponFor(cart));
    }
}
