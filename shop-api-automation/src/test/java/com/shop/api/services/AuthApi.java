package com.shop.api.services;

import io.qameta.allure.Step;
import io.restassured.response.Response;

import java.util.Map;

public class AuthApi extends BaseService {

    @Step("Log in as {email}")
    public Response login(String email, String password) {
        return request()
                .body(Map.of("email", email, "password", password))
                .post("/api/auth/login");
    }

    @Step("Register {email}")
    public Response register(String email, String password, String fullName) {
        return request()
                .body(Map.of("email", email, "password", password, "fullName", fullName))
                .post("/api/auth/register");
    }

    @Step("Fetch the current user")
    public Response me(String token) {
        return authorised(token).get("/api/auth/me");
    }

    @Step("Log out")
    public Response logout(String token) {
        return authorised(token).post("/api/auth/logout");
    }
}
