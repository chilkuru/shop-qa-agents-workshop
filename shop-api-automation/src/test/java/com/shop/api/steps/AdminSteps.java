package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.assertj.core.api.Assertions.assertThat;

public class AdminSteps {

    private final ShopApi shop;
    private final ScenarioContext context;

    public AdminSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @When("I open the product administration list")
    public void iOpenTheProductAdministrationList() {
        context.lastResponse(shop.admin().products(context.token()));
    }

    @When("I set the stock of {string} to {int}")
    public void iSetTheStockOfTo(String product, int stock) {
        context.lastResponse(shop.admin().setStock(context.token(), shop.productId(product), stock));
    }

    @When("I hide {string} from the catalog")
    public void iHideFromTheCatalog(String product) {
        context.lastResponse(shop.admin().setActive(context.token(), shop.productId(product), false));
    }

    @Then("I see all {int} products including hidden ones")
    public void iSeeAllProductsIncludingHiddenOnes(int expected) {
        assertThat(context.lastResponse().statusCode()).isEqualTo(200);
        assertThat(context.lastResponse().jsonPath().getList("$")).hasSize(expected);
    }

    @Then("the request is refused as forbidden")
    public void theRequestIsRefusedAsForbidden() {
        assertThat(context.lastResponse().statusCode()).isEqualTo(403);
    }

    @Then("{string} reports {int} in stock")
    public void reportsInStock(String product, int expected) {
        assertThat(context.lastResponse().jsonPath().getInt("stock")).isEqualTo(expected);
    }

    @Then("the shopper catalog holds {int} products")
    public void theShopperCatalogHoldsProducts(int expected) {
        assertThat(shop.catalog().products(null, null, 50).jsonPath().getList("items"))
                .hasSize(expected);
    }

    @Then("restoring {string} brings the catalog back to {int}")
    public void restoringBringsTheCatalogBackTo(String product, int expected) {
        // Hidden products are excluded from the shopper catalog, so the id is resolved
        // through the admin list rather than the public one.
        long productId = shop.admin().products(context.token()).jsonPath()
                .getLong("find { it.name == '" + product + "' }.id");

        shop.admin().setActive(context.token(), productId, true).then().statusCode(200);
        assertThat(shop.catalog().products(null, null, 50).jsonPath().getList("items"))
                .hasSize(expected);
    }
}
