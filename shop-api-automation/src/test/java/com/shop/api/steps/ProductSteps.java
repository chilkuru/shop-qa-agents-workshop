package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.fixtures.Fixtures;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.assertj.core.api.Assertions.assertThat;

public class ProductSteps {

    private final ShopApi shop;
    private final ScenarioContext context;

    public ProductSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @When("I open the product {string}")
    public void iOpenTheProduct(String name) {
        context.lastResponse(shop.catalog().product(shop.productId(name)));
    }

    @When("I request the product with id {long}")
    public void iRequestTheProductWithId(long id) {
        context.lastResponse(shop.catalog().product(id));
    }

    @Then("I see the product details for {string}")
    public void iSeeTheProductDetailsFor(String name) {
        assertThat(context.lastResponse().statusCode()).isEqualTo(200);
        assertThat(context.lastResponse().jsonPath().getString("name")).isEqualTo(name);
        assertThat(context.lastResponse().jsonPath().getString("sku")).isNotBlank();
    }

    @Then("the product shows the price of {int} {string}")
    public void theProductShowsThePriceOf(int quantity, String name) {
        assertThat(context.lastResponse().jsonPath().getLong("pricePaise"))
                .isEqualTo(Fixtures.pricePaise(name) * quantity);
    }

    @Then("the product belongs to category {string}")
    public void theProductBelongsToCategory(String category) {
        assertThat(context.lastResponse().jsonPath().getString("category")).isEqualTo(category);
    }

    @Then("the product is shown as in stock")
    public void theProductIsShownAsInStock() {
        assertThat(context.lastResponse().jsonPath().getBoolean("inStock")).isTrue();
    }

    @Then("the product is reported as not found")
    public void theProductIsReportedAsNotFound() {
        assertThat(context.lastResponse().statusCode()).isEqualTo(404);
    }
}
