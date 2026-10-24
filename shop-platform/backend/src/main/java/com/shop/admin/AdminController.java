package com.shop.admin;

import com.shop.auth.AuthService;
import com.shop.catalog.Product;
import com.shop.catalog.ProductRepository;
import com.shop.common.ApiExceptions;
import com.shop.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only catalog management. Role is checked here rather than in the security
 * config so the refusal is a clean 403 with a message the UI can show.
 */
@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Catalog management; ADMIN role required")
public class AdminController {

    private final ProductRepository products;
    private final AuthService authService;

    public AdminController(ProductRepository products, AuthService authService) {
        this.products = products;
        this.authService = authService;
    }

    public record UpdateStockRequest(@NotNull @Min(0) Integer stock) {
    }

    public record SetActiveRequest(@NotNull Boolean active) {
    }

    public record AdminProductResponse(
            Long id, String sku, String name, String category,
            Integer pricePaise, Integer stock, Boolean active) {

        static AdminProductResponse from(Product p) {
            return new AdminProductResponse(
                    p.getId(), p.getSku(), p.getName(), p.getCategory(),
                    p.getPricePaise(), p.getStock(), p.getActive());
        }
    }

    @GetMapping("/products")
    @Operation(summary = "List every product, including inactive ones")
    public List<AdminProductResponse> listProducts() {
        requireAdmin();
        return products.findAll().stream()
                .sorted((a, b) -> a.getName().compareTo(b.getName()))
                .map(AdminProductResponse::from)
                .toList();
    }

    @PatchMapping("/products/{productId}/stock")
    @Operation(summary = "Set a product's stock level")
    @Transactional
    public AdminProductResponse updateStock(@PathVariable Long productId,
                                            @Valid @RequestBody UpdateStockRequest request) {
        requireAdmin();
        Product product = product(productId);
        product.setStock(request.stock());
        return AdminProductResponse.from(products.save(product));
    }

    @PatchMapping("/products/{productId}/active")
    @Operation(summary = "Show or hide a product in the catalog")
    @Transactional
    public AdminProductResponse setActive(@PathVariable Long productId,
                                          @Valid @RequestBody SetActiveRequest request) {
        requireAdmin();
        Product product = product(productId);
        product.setActive(request.active());
        return AdminProductResponse.from(products.save(product));
    }

    private Product product(Long productId) {
        return products.findById(productId)
                .orElseThrow(() -> new ApiExceptions.NotFoundException("No product " + productId));
    }

    private void requireAdmin() {
        User user = authService.currentUser();
        if (user.getRole() != User.Role.ADMIN) {
            throw new ApiExceptions.ForbiddenException("This action requires the ADMIN role");
        }
    }
}
