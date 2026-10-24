package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.fixtures.Fixtures;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

public class CatalogSteps {

    private final ShopApi shop;
    private final ScenarioContext context;

    public CatalogSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @When("I open the catalog")
    public void iOpenTheCatalog() {
        context.lastResponse(shop.catalog().products(null, null, 50));
    }

    @When("I search the catalog for {string}")
    public void iSearchTheCatalogFor(String term) {
        context.lastResponse(shop.catalog().products(term, null, 50));
    }

    @Given("I have searched the catalog for {string}")
    public void iHaveSearchedTheCatalogFor(String term) {
        iSearchTheCatalogFor(term);
    }

    @When("I filter the catalog by category {string}")
    public void iFilterTheCatalogByCategory(String category) {
        context.lastResponse(shop.catalog().products(null, category, 50));
    }

    @When("I clear the catalog filters")
    public void iClearTheCatalogFilters() {
        context.lastResponse(shop.catalog().products(null, null, 50));
    }

    @Then("I see {int} products")
    public void iSeeNProducts(int expected) {
        assertThat(items()).hasSize(expected);
    }

    @Then("I see {int} product")
    public void iSeeOneProduct(int expected) {
        iSeeNProducts(expected);
    }

    @Then("the results include {string}")
    public void theResultsInclude(String name) {
        assertThat(names()).contains(name);
    }

    @Then("every result belongs to category {string}")
    public void everyResultBelongsToCategory(String category) {
        assertThat(items()).isNotEmpty();
        assertThat(items()).allSatisfy(item ->
                assertThat(String.valueOf(item.get("category"))).isEqualTo(category));
    }

    @Then("I am told no products matched")
    public void iAmToldNoProductsMatched() {
        Response response = context.lastResponse();
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(items()).isEmpty();
        assertThat(response.jsonPath().getInt("totalItems")).isZero();
    }

    @Then("the catalog holds every demo product")
    public void theCatalogHoldsEveryDemoProduct() {
        assertThat(items()).hasSize(Fixtures.catalogSize());
    }

    private List<Map<String, Object>> items() {
        return context.lastResponse().jsonPath().getList("items");
    }

    private List<String> names() {
        return context.lastResponse().jsonPath().getList("items.name", String.class);
    }
}
