package com.shop.api.services;

import io.qameta.allure.Step;
import io.restassured.response.Response;

import java.util.List;
import java.util.Map;

/** Wraps the triple-gated test-support endpoints used for scenario setup. */
public class TestSupportApi extends BaseService {

    @Step("Check test-support is enabled")
    public Response health() {
        return withTestToken().get("/api/test-support/health");
    }

    @Step("Seed user {email}")
    public Response seedUser(String email, String password, String fullName, String role) {
        return withTestToken()
                .body(Map.of("email", email, "password", password, "fullName", fullName, "role", role))
                .post("/api/test-support/seed-user");
    }

    @Step("Seed cart for {email}")
    public Response seedCart(String email, List<Map<String, Object>> items) {
        return withTestToken()
                .body(Map.of("email", email, "items", items))
                .post("/api/test-support/seed-cart");
    }

    @Step("Reset the signed-in user's carts and orders")
    public Response resetMine(String token) {
        return withTestToken().header("Authorization", "Bearer " + token)
                .post("/api/test-support/reset");
    }
}
