package com.shop.api.services;

import io.qameta.allure.Step;
import io.restassured.response.Response;

import java.util.Map;

public class ReviewApi extends BaseService {

    @Step("List reviews for product {productId}")
    public Response list(long productId) {
        return request().get("/api/products/{productId}/reviews", productId);
    }

    @Step("List reviews for product {productId} as the signed-in shopper")
    public Response listAs(String token, long productId) {
        return authorised(token).get("/api/products/{productId}/reviews", productId);
    }

    @Step("Review product {productId} with {rating} stars")
    public Response submit(String token, long productId, int rating, String comment) {
        return authorised(token)
                .body(Map.of("rating", rating, "comment", comment))
                .post("/api/products/{productId}/reviews", productId);
    }
}
