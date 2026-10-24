package com.shop.api.services;

import com.shop.api.config.Config;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;

import static io.restassured.RestAssured.given;

/**
 * Shared request construction for every service object. Holds no assertions —
 * verification belongs to the step definitions.
 */
public abstract class BaseService {

    protected static final String TEST_TOKEN_HEADER = "X-Test-Token";

    protected RequestSpecification request() {
        return given()
                .spec(new RequestSpecBuilder()
                        .setBaseUri(Config.get().baseUrl())
                        .setContentType(ContentType.JSON)
                        .setAccept(ContentType.JSON)
                        .build())
                // Attaches the full request/response pair to the Allure report.
                .filter(new AllureRestAssured());
    }

    protected RequestSpecification authorised(String token) {
        return request().header("Authorization", "Bearer " + token);
    }

    protected RequestSpecification withTestToken() {
        return request().header(TEST_TOKEN_HEADER, Config.get().testSupportToken());
    }
}
