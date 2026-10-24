package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Given;
import io.restassured.response.Response;

import static org.assertj.core.api.Assertions.assertThat;

public class CommonSteps {

    private final ShopApi shop;
    private final ScenarioContext context;

    public CommonSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @Given("the shop is available")
    public void theShopIsAvailable() {
        Response response = shop.testSupport().health();
        assertThat(response.statusCode())
                .as("test-support health; is the backend running with SPRING_PROFILES_ACTIVE=test?")
                .isEqualTo(200);
    }

    @Given("the catalog is seeded with the demo products")
    public void theCatalogIsSeeded() {
        Response response = shop.catalog().products(null, null, 50);
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.jsonPath().getList("items")).isNotEmpty();
    }

    @Given("I am not signed in")
    public void iAmNotSignedIn() {
        context.signOut();
    }
}
