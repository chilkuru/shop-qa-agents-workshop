package com.shop.testsupport;

import com.shop.auth.AuthService;
import com.shop.cart.CartRepository;
import com.shop.cart.CartService;
import com.shop.catalog.ProductRepository;
import com.shop.common.ApiExceptions;
import com.shop.config.ShopProperties;
import com.shop.order.OrderRepository;
import com.shop.user.User;
import com.shop.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Test-only fixtures endpoint. THREE independent gates, all required:
 *   1. @Profile("test")  — absent entirely from a production image
 *   2. X-Test-Token      — shared secret from the TEST_SUPPORT_TOKEN env var
 *   3. per-user scoping  — reset touches only the caller's data
 *
 * A global reset is intentionally NOT exposed to ordinary callers: during a live
 * workshop one attendee wiping shared state would break everyone else's session.
 */
@RestController
@RequestMapping("/api/test-support")
@Profile("test")
@Tag(name = "Test Support", description = "Fixture seeding and reset. Test profile only.")
public class TestSupportController {

    private final ShopProperties properties;
    private final UserRepository users;
    private final CartRepository carts;
    private final OrderRepository orders;
    private final ProductRepository products;
    private final CartService cartService;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;
    private final com.shop.wishlist.WishlistRepository wishlist;
    private final com.shop.address.AddressRepository addresses;
    private final com.shop.review.ReviewRepository reviews;

    public TestSupportController(ShopProperties properties,
                                 UserRepository users,
                                 CartRepository carts,
                                 OrderRepository orders,
                                 ProductRepository products,
                                 CartService cartService,
                                 AuthService authService,
                                 PasswordEncoder passwordEncoder,
                                 com.shop.wishlist.WishlistRepository wishlist,
                                 com.shop.address.AddressRepository addresses,
                                 com.shop.review.ReviewRepository reviews) {
        this.properties = properties;
        this.users = users;
        this.carts = carts;
        this.orders = orders;
        this.products = products;
        this.cartService = cartService;
        this.authService = authService;
        this.passwordEncoder = passwordEncoder;
        this.wishlist = wishlist;
        this.addresses = addresses;
        this.reviews = reviews;
    }

    public record SeedUserRequest(
            @NotBlank @Email String email,
            @NotBlank String password,
            @NotBlank String fullName,
            String role) {
    }

    public record SeedCartItem(@NotNull Long productId, @NotNull Integer quantity) {
    }

    public record SeedCartRequest(
            @NotBlank @Email String email,
            @NotNull List<SeedCartItem> items) {
    }

    @GetMapping("/health")
    @Operation(summary = "Confirm test-support is enabled")
    public ResponseEntity<String> health(@RequestHeader(value = "X-Test-Token", required = false) String token) {
        requireToken(token);
        return ResponseEntity.ok("test-support enabled");
    }

    @PostMapping("/seed-user")
    @Operation(summary = "Create (or update) a user with known credentials")
    @Transactional
    public ResponseEntity<Void> seedUser(@RequestHeader(value = "X-Test-Token", required = false) String token,
                                         @Valid @RequestBody SeedUserRequest request) {
        requireToken(token);

        User user = users.findByEmailIgnoreCase(request.email())
                .orElseGet(() -> User.builder().email(request.email().toLowerCase()).build());

        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setRole("ADMIN".equalsIgnoreCase(request.role()) ? User.Role.ADMIN : User.Role.CUSTOMER);
        users.save(user);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/seed-cart")
    @Operation(summary = "Put a known set of items in a user's cart, bypassing the UI")
    @Transactional
    public ResponseEntity<Void> seedCart(@RequestHeader(value = "X-Test-Token", required = false) String token,
                                         @Valid @RequestBody SeedCartRequest request) {
        requireToken(token);

        User user = users.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ApiExceptions.NotFoundException("No user " + request.email()));

        cartService.clear(user);
        request.items().forEach(item -> cartService.addItem(user, item.productId(), item.quantity()));

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset")
    @Operation(summary = "Reset ONLY the authenticated caller's cart and orders")
    @Transactional
    public ResponseEntity<Void> resetMine(@RequestHeader(value = "X-Test-Token", required = false) String token) {
        requireToken(token);

        User user = authService.currentUser();
        reviews.deleteByUserId(user.getId());
        wishlist.deleteByUserId(user.getId());
        addresses.deleteByUserId(user.getId());
        orders.deleteByUserId(user.getId());
        carts.deleteByUserId(user.getId());

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-all")
    @Operation(summary = "DESTRUCTIVE. Wipe all carts, orders and users. Admin role required.")
    @Transactional
    public ResponseEntity<Void> resetAll(@RequestHeader(value = "X-Test-Token", required = false) String token) {
        requireToken(token);

        if (authService.currentUser().getRole() != User.Role.ADMIN) {
            throw new ApiExceptions.ForbiddenException("reset-all requires the ADMIN role");
        }
        orders.deleteAll();
        carts.deleteAll();
        users.deleteAll();
        products.findAll().forEach(p -> {
            p.setStock(Math.max(p.getStock(), 12));
            products.save(p);
        });

        return ResponseEntity.noContent().build();
    }

    private void requireToken(String provided) {
        String expected = properties.testSupport().token();
        if (expected == null || expected.isBlank() || !expected.equals(provided)) {
            throw new ApiExceptions.ForbiddenException("Invalid or missing X-Test-Token");
        }
    }
}
