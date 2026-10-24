package com.shop.api.services;

import io.qameta.allure.Step;
import io.restassured.response.Response;

import java.util.Map;

public class AddressApi extends BaseService {

    @Step("List saved addresses")
    public Response list(String token) {
        return authorised(token).get("/api/addresses");
    }

    @Step("Save the {label} address")
    public Response save(String token, Map<String, String> address) {
        return authorised(token).body(address).post("/api/addresses");
    }

    @Step("Make address {addressId} the default")
    public Response makeDefault(String token, long addressId) {
        return authorised(token).post("/api/addresses/{addressId}/default", addressId);
    }

    @Step("Delete address {addressId}")
    public Response delete(String token, long addressId) {
        return authorised(token).delete("/api/addresses/{addressId}", addressId);
    }
}
