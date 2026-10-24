package com.shop.api.services;

import io.qameta.allure.Step;
import io.restassured.response.Response;

import java.util.Map;

public class AdminApi extends BaseService {

    @Step("List every product as an administrator")
    public Response products(String token) {
        return authorised(token).get("/api/admin/products");
    }

    @Step("Set stock of product {productId} to {stock}")
    public Response setStock(String token, long productId, int stock) {
        return authorised(token)
                .body(Map.of("stock", stock))
                .patch("/api/admin/products/{productId}/stock", productId);
    }

    @Step("Set product {productId} active to {active}")
    public Response setActive(String token, long productId, boolean active) {
        return authorised(token)
                .body(Map.of("active", active))
                .patch("/api/admin/products/{productId}/active", productId);
    }
}
