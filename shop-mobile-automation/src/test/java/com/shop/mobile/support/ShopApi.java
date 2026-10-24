package com.shop.mobile.support;

import com.shop.mobile.config.Config;
import com.shop.mobile.fixtures.Fixtures;
import io.qameta.allure.Step;
import io.restassured.http.ContentType;

import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;

/**
 * Facade used only to put the backend into a known state. UI outcomes are asserted
 * through the screen objects, never through this.
 */
public class ShopApi {

    @Step("Ensure fixture user {user.email} exists")
    public void ensureUser(Fixtures.User user) {
        given().baseUri(Config.get().apiBaseUrl())
                .contentType(ContentType.JSON)
                .header("X-Test-Token", Config.get().testSupportToken())
                .body(Map.of(
                        "email", user.email(),
                        "password", user.password(),
                        "fullName", user.fullName(),
                        "role", user.role()))
                .post("/api/test-support/seed-user")
                .then().statusCode(204);
    }

    @Step("Empty the cart for {email}")
    public void emptyCart(String email) {
        given().baseUri(Config.get().apiBaseUrl())
                .contentType(ContentType.JSON)
                .header("X-Test-Token", Config.get().testSupportToken())
                .body(Map.of("email", email, "items", List.of()))
                .post("/api/test-support/seed-cart")
                .then().statusCode(204);

        // seed-cart clears lines only; a coupon left by an earlier scenario would skew totals.
        given().baseUri(Config.get().apiBaseUrl())
                .header("Authorization", "Bearer " + tokenFor(Fixtures.userByEmail(email)))
                .delete("/api/cart/coupon")
                .then().statusCode(anyOf(is(200), is(204)));
    }

    @Step("Check the backend is reachable")
    public boolean isHealthy() {
        return given().baseUri(Config.get().apiBaseUrl())
                .header("X-Test-Token", Config.get().testSupportToken())
                .get("/api/test-support/health")
                .statusCode() == 200;
    }

    @Step("Check the catalog is populated")
    public boolean catalogIsSeeded() {
        return given().baseUri(Config.get().apiBaseUrl())
                .queryParam("size", 50)
                .get("/api/products")
                .jsonPath().getList("items").size() > 0;
    }

    @Step("Place an order for {product} as {email}")
    public String placeOrder(String email, String product) {
        Fixtures.User user = Fixtures.userByEmail(email);
        seedCart(email, product, 1);

        return given().baseUri(Config.get().apiBaseUrl())
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenFor(user))
                .body(Map.of(
                        "shippingName", "Demo Shopper",
                        "shippingAddress", "42 MG Road, Bengaluru, Karnataka 560001",
                        "card", Map.of("number", "4111111111111111", "expiry", "12/30", "cvc", "123")))
                .post("/api/checkout")
                .then().statusCode(201)
                .extract().jsonPath().getString("orderNumber");
    }

    @Step("Reset carts and orders for {email}")
    public void resetOrders(String email) {
        given().baseUri(Config.get().apiBaseUrl())
                .header("X-Test-Token", Config.get().testSupportToken())
                .header("Authorization", "Bearer " + tokenFor(Fixtures.userByEmail(email)))
                .post("/api/test-support/reset")
                .then().statusCode(204);
    }

    private void seedCart(String email, String product, int quantity) {
        int productId = given().baseUri(Config.get().apiBaseUrl())
                .queryParam("search", product)
                .queryParam("size", 50)
                .get("/api/products")
                .jsonPath().getInt("items.find { it.name == '" + product + "' }.id");

        given().baseUri(Config.get().apiBaseUrl())
                .contentType(ContentType.JSON)
                .header("X-Test-Token", Config.get().testSupportToken())
                .body(Map.of("email", email,
                        "items", List.of(Map.of("productId", productId, "quantity", quantity))))
                .post("/api/test-support/seed-cart")
                .then().statusCode(204);
    }

    @Step("Seed the cart of {email} with {quantity} of {product}")
    public void seedCartWith(String email, String product, int quantity) {
        seedCart(email, product, quantity);
    }

    @Step("Look up the id of {product}")
    public int productId(String product) {
        return given().baseUri(Config.get().apiBaseUrl())
                .queryParam("search", product)
                .queryParam("size", 50)
                .get("/api/products")
                .jsonPath().getInt("items.find { it.name == '" + product + "' }.id");
    }

    @Step("Empty the wishlist of {email}")
    public void clearWishlist(String email) {
        String token = tokenFor(Fixtures.userByEmail(email));
        List<Integer> productIds = given().baseUri(Config.get().apiBaseUrl())
                .header("Authorization", "Bearer " + token)
                .get("/api/wishlist")
                .then().statusCode(200)
                .extract().jsonPath().getList("items.productId", Integer.class);

        for (Integer productId : productIds) {
            given().baseUri(Config.get().apiBaseUrl())
                    .header("Authorization", "Bearer " + token)
                    .delete("/api/wishlist/" + productId)
                    .then().statusCode(anyOf(is(200), is(204)));
        }
    }

    @Step("Save {product} to the wishlist of {email}")
    public void saveToWishlist(String email, String product) {
        given().baseUri(Config.get().apiBaseUrl())
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenFor(Fixtures.userByEmail(email)))
                .body(Map.of("productId", productId(product)))
                .post("/api/wishlist")
                .then().statusCode(anyOf(is(200), is(201)));
    }

    @Step("Remove every saved address of {email}")
    public void clearAddresses(String email) {
        String token = tokenFor(Fixtures.userByEmail(email));
        List<Integer> ids = given().baseUri(Config.get().apiBaseUrl())
                .header("Authorization", "Bearer " + token)
                .get("/api/addresses")
                .then().statusCode(200)
                .extract().jsonPath().getList("addresses.id", Integer.class);

        for (Integer id : ids) {
            given().baseUri(Config.get().apiBaseUrl())
                    .header("Authorization", "Bearer " + token)
                    .delete("/api/addresses/" + id)
                    .then().statusCode(anyOf(is(200), is(204)));
        }
    }

    @Step("Save a delivery address for {email}")
    public void saveAddress(String email, Map<String, String> address) {
        given().baseUri(Config.get().apiBaseUrl())
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenFor(Fixtures.userByEmail(email)))
                .body(address)
                .post("/api/addresses")
                .then().statusCode(anyOf(is(200), is(201)));
    }

    @Step("Review {product} with {rating} stars as {email}")
    public void submitReview(String email, String product, int rating) {
        given().baseUri(Config.get().apiBaseUrl())
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenFor(Fixtures.userByEmail(email)))
                .body(Map.of("rating", rating, "comment", "Seeded " + rating + "-star review"))
                .post("/api/products/" + productId(product) + "/reviews")
                .then().statusCode(anyOf(is(200), is(201)));
    }

    /** A run that dies mid-scenario can leave a product hidden or short-stocked. */
    @Step("Restore {product} to visible with {stock} in stock")
    public void restoreProduct(String product, int stock) {
        String token = tokenFor(Fixtures.userByEmail("admin@shop.in"));
        int id = productId(product);

        given().baseUri(Config.get().apiBaseUrl())
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + token)
                .body(Map.of("stock", stock))
                .patch("/api/admin/products/" + id + "/stock")
                .then().statusCode(200);

        given().baseUri(Config.get().apiBaseUrl())
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + token)
                .body(Map.of("active", true))
                .patch("/api/admin/products/" + id + "/active")
                .then().statusCode(200);
    }

    private String tokenFor(Fixtures.User user) {
        return given().baseUri(Config.get().apiBaseUrl())
                .contentType(ContentType.JSON)
                .body(Map.of("email", user.email(), "password", user.password()))
                .post("/api/auth/login")
                .then().statusCode(200)
                .extract().jsonPath().getString("token");
    }
}
