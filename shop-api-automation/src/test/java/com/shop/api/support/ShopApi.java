package com.shop.api.support;

import com.shop.api.fixtures.Fixtures;
import com.shop.api.services.AddressApi;
import com.shop.api.services.AdminApi;
import com.shop.api.services.AuthApi;
import com.shop.api.services.CartApi;
import com.shop.api.services.CatalogApi;
import com.shop.api.services.OrderApi;
import com.shop.api.services.ReviewApi;
import com.shop.api.services.TestSupportApi;
import com.shop.api.services.WishlistApi;
import io.qameta.allure.Step;
import io.restassured.response.Response;

import java.util.List;
import java.util.Map;

/**
 * Facade over the service objects. Step definitions depend on this alone, so adding
 * an endpoint never ripples into the step layer. Holds no assertions and no state.
 */
public class ShopApi {

    private final AuthApi auth = new AuthApi();
    private final CatalogApi catalog = new CatalogApi();
    private final CartApi cart = new CartApi();
    private final OrderApi order = new OrderApi();
    private final TestSupportApi testSupport = new TestSupportApi();
    private final WishlistApi wishlist = new WishlistApi();
    private final AddressApi address = new AddressApi();
    private final ReviewApi review = new ReviewApi();
    private final AdminApi admin = new AdminApi();

    public WishlistApi wishlist() {
        return wishlist;
    }

    public AddressApi address() {
        return address;
    }

    public ReviewApi review() {
        return review;
    }

    public AdminApi admin() {
        return admin;
    }

    public AuthApi auth() {
        return auth;
    }

    public CatalogApi catalog() {
        return catalog;
    }

    public CartApi cart() {
        return cart;
    }

    public OrderApi order() {
        return order;
    }

    public TestSupportApi testSupport() {
        return testSupport;
    }

    /** Signs in and returns the bearer token, failing loudly if the credentials are wrong. */
    @Step("Sign in as {email} and capture the token")
    public String signIn(String email, String password) {
        Response response = auth.login(email, password);
        if (response.statusCode() != 200) {
            throw new IllegalStateException(
                    "Sign-in failed for " + email + ": " + response.statusCode() + " " + response.asString());
        }
        return response.jsonPath().getString("token");
    }

    /** Guarantees the fixture user exists with known credentials before a scenario runs. */
    @Step("Ensure fixture user {email} exists")
    public void ensureUser(Fixtures.User user) {
        testSupport.seedUser(user.email(), user.password(), user.fullName(), user.role())
                .then().statusCode(204);
    }

    @Step("Resolve product '{name}' to its id")
    public long productId(String name) {
        Response response = catalog.products(name, null, 50);
        List<Map<String, Object>> items = response.jsonPath().getList("items");
        return items.stream()
                .filter(p -> name.equalsIgnoreCase(String.valueOf(p.get("name"))))
                .findFirst()
                .map(p -> ((Number) p.get("id")).longValue())
                .orElseThrow(() -> new IllegalArgumentException("No product named '" + name + "'"));
    }

    @Step("Put the cart into a known state for {email}")
    public void seedCart(String email, String productName, int quantity) {
        testSupport.seedCart(email, List.of(Map.of("productId", productId(productName), "quantity", quantity)))
                .then().statusCode(204);
    }

    @Step("Empty the cart for {email}")
    public void emptyCart(String email) {
        testSupport.seedCart(email, List.of()).then().statusCode(204);
    }

    /**
     * Tops every product back up through the admin API. Called once per suite.
     */
    @Step("Replenish catalog stock to at least {minimum}")
    public void replenishStock(int minimum) {
        Fixtures.User adminUser = Fixtures.user("admin");
        ensureUser(adminUser);
        String adminToken = signIn(adminUser.email(), adminUser.password());

        Response all = admin.products(adminToken);
        List<Map<String, Object>> products = all.jsonPath().getList("$");

        for (Map<String, Object> product : products) {
            long id = ((Number) product.get("id")).longValue();
            int stock = ((Number) product.get("stock")).intValue();
            boolean active = Boolean.TRUE.equals(product.get("active"));

            if (stock < minimum) {
                admin.setStock(adminToken, id, minimum);
            }
            if (!active) {
                admin.setActive(adminToken, id, true);
            }
        }
    }
}
