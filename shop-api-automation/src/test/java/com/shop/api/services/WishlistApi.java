package com.shop.api.services;

import io.qameta.allure.Step;
import io.restassured.response.Response;

import java.util.Map;

public class WishlistApi extends BaseService {

    @Step("Get the wishlist")
    public Response get(String token) {
        return authorised(token).get("/api/wishlist");
    }

    @Step("Save product {productId} for later")
    public Response add(String token, long productId) {
        return authorised(token).body(Map.of("productId", productId)).post("/api/wishlist");
    }

    @Step("Remove product {productId} from the wishlist")
    public Response remove(String token, long productId) {
        return authorised(token).delete("/api/wishlist/{productId}", productId);
    }
}
