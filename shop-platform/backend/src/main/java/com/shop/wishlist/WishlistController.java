package com.shop.wishlist;

import com.shop.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@Tag(name = "Wishlist", description = "Products saved for later")
public class WishlistController {

    private final WishlistService wishlistService;
    private final AuthService authService;

    public WishlistController(WishlistService wishlistService, AuthService authService) {
        this.wishlistService = wishlistService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "List the current user's saved products")
    public WishlistDtos.WishlistResponse list() {
        return WishlistDtos.WishlistResponse.from(wishlistService.list(authService.currentUser()));
    }

    @PostMapping
    @Operation(summary = "Save a product for later")
    public WishlistDtos.WishlistResponse add(@Valid @RequestBody WishlistDtos.AddWishlistRequest request) {
        wishlistService.add(authService.currentUser(), request.productId());
        return list();
    }

    @DeleteMapping("/{productId}")
    @Operation(summary = "Remove a saved product")
    public WishlistDtos.WishlistResponse remove(@PathVariable Long productId) {
        wishlistService.remove(authService.currentUser(), productId);
        return list();
    }
}
