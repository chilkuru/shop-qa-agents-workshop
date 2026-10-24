package com.shop.api.services;

import com.shop.api.fixtures.Fixtures;
import io.qameta.allure.Step;
import io.restassured.response.Response;

import java.util.Map;

public class OrderApi extends BaseService {

    @Step("Check out with card ending {cardKey}")
    public Response checkout(String token, Fixtures.Card card, Fixtures.Shipping shipping) {
        return authorised(token)
                .body(Map.of(
                        "shippingName", shipping.name(),
                        "shippingAddress", shipping.address(),
                        "card", Map.of(
                                "number", card.number(),
                                "expiry", card.expiry(),
                                "cvc", card.cvc())))
                .post("/api/checkout");
    }

    @Step("List orders")
    public Response orders(String token) {
        return authorised(token).get("/api/orders");
    }

    @Step("Get order {orderNumber}")
    public Response order(String token, String orderNumber) {
        return authorised(token).get("/api/orders/{orderNumber}", orderNumber);
    }
}
