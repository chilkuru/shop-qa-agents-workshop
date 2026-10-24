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

public class CartSteps {

    private final ShopApi shop;
    private final ScenarioContext context;

    public CartSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @Given("my cart is empty")
    public void myCartIsEmpty() {
        shop.emptyCart(context.currentUserEmail());
    }

    @Given("my cart contains {int} of {string}")
    public void myCartContains(int quantity, String product) {
        shop.seedCart(context.currentUserEmail(), product, quantity);
    }

    @When("I add {string} to my cart")
    public void iAddToMyCart(String product) {
        context.lastResponse(shop.cart().addItem(context.token(), shop.productId(product), 1));
    }

    @When("I change the quantity of {string} to {int}")
    public void iChangeTheQuantityOf(String product, int quantity) {
        context.lastResponse(shop.cart().updateItem(context.token(), shop.productId(product), quantity));
    }

    @When("I remove {string} from my cart")
    public void iRemoveFromMyCart(String product) {
        context.lastResponse(shop.cart().removeItem(context.token(), shop.productId(product)));
    }

    @Then("my cart contains {int} line")
    public void myCartContainsNLines(int expected) {
        assertThat(cartItems()).hasSize(expected);
    }

    @Then("my cart contains {int} lines")
    public void myCartContainsNLinesPlural(int expected) {
        myCartContainsNLines(expected);
    }

    @Then("my cart shows {int} of {string}")
    public void myCartShows(int quantity, String product) {
        Map<String, Object> line = cartItems().stream()
                .filter(i -> product.equalsIgnoreCase(String.valueOf(i.get("name"))))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No cart line for '" + product + "'"));

        assertThat(((Number) line.get("quantity")).intValue()).isEqualTo(quantity);
    }

    @Then("my cart is now empty")
    public void myCartIsNowEmpty() {
        assertThat(cartItems()).isEmpty();
    }

    @Then("my cart total is the price of {int} {string}")
    public void myCartTotalIsThePriceOf(int quantity, String product) {
        long expected = Fixtures.pricePaise(product) * quantity;
        assertThat(currentCart().jsonPath().getLong("totalPaise")).isEqualTo(expected);
    }

    private Response currentCart() {
        return shop.cart().get(context.token());
    }

    private List<Map<String, Object>> cartItems() {
        return currentCart().jsonPath().getList("items");
    }
}
