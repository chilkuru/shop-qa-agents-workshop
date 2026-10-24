package com.shop.api.services;

import io.qameta.allure.Step;
import io.restassured.response.Response;

import java.util.Map;

public class CartApi extends BaseService {

    @Step("Get the cart")
    public Response get(String token) {
        return authorised(token).get("/api/cart");
    }

    @Step("Add product {productId} x{quantity} to the cart")
    public Response addItem(String token, long productId, int quantity) {
        return authorised(token)
                .body(Map.of("productId", productId, "quantity", quantity))
                .post("/api/cart/items");
    }

    @Step("Set product {productId} quantity to {quantity}")
    public Response updateItem(String token, long productId, int quantity) {
        return authorised(token)
                .body(Map.of("quantity", quantity))
                .patch("/api/cart/items/{productId}", productId);
    }

    @Step("Remove product {productId} from the cart")
    public Response removeItem(String token, long productId) {
        return authorised(token).delete("/api/cart/items/{productId}", productId);
    }

    @Step("Clear the cart")
    public Response clear(String token) {
        return authorised(token).delete("/api/cart");
    }

    @Step("Apply coupon {code}")
    public Response applyCoupon(String token, String code) {
        return authorised(token).body(Map.of("code", code)).post("/api/cart/coupon");
    }

    @Step("Remove the applied coupon")
    public Response removeCoupon(String token) {
        return authorised(token).delete("/api/cart/coupon");
    }
}
