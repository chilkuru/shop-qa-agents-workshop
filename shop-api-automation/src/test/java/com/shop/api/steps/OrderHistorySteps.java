package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.fixtures.Fixtures;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class OrderHistorySteps {

    private final ShopApi shop;
    private final ScenarioContext context;

    public OrderHistorySteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @Given("I have no order history")
    public void iHaveNoOrderHistory() {
        shop.testSupport().resetMine(context.token()).then().statusCode(204);
    }

    @Given("I have already placed an order for {string}")
    public void iHaveAlreadyPlacedAnOrderFor(String product) {
        shop.seedCart(context.currentUserEmail(), product, 1);

        Response checkout = shop.order().checkout(
                context.token(), Fixtures.card("approved"), Fixtures.shipping());
        assertThat(checkout.statusCode()).isEqualTo(201);

        context.lastOrderNumber(checkout.jsonPath().getString("orderNumber"));
    }

    @Given("{string} has placed an order")
    public void hasPlacedAnOrder(String email) {
        Fixtures.User other = Fixtures.userByEmail(email);
        shop.ensureUser(other);

        String otherToken = shop.signIn(other.email(), other.password());
        shop.seedCart(other.email(), "Desk Lamp", 1);

        Response checkout = shop.order().checkout(
                otherToken, Fixtures.card("approved"), Fixtures.shipping());
        assertThat(checkout.statusCode()).isEqualTo(201);

        context.otherShopperOrderNumber(checkout.jsonPath().getString("orderNumber"));
    }

    @When("I open my order history")
    public void iOpenMyOrderHistory() {
        context.lastResponse(shop.order().orders(context.token()));
    }

    @Then("my most recent order is listed as confirmed")
    public void myMostRecentOrderIsListedAsConfirmed() {
        assertThat(context.lastResponse().statusCode()).isEqualTo(200);

        List<String> numbers = orderNumbers();
        assertThat(numbers).isNotEmpty();
        assertThat(numbers).contains(context.lastOrderNumber());
        assertThat(statusOf(context.lastOrderNumber())).isEqualTo("CONFIRMED");
    }

    @Then("I am told I have no orders")
    public void iAmToldIHaveNoOrders() {
        assertThat(context.lastResponse().statusCode()).isEqualTo(200);
        assertThat(orderNumbers()).isEmpty();
    }

    @Then("that order is not listed")
    public void thatOrderIsNotListed() {
        assertThat(orderNumbers())
                .as("orders must be scoped to the account that placed them")
                .doesNotContain(context.otherShopperOrderNumber());
    }

    private List<String> orderNumbers() {
        return context.lastResponse().jsonPath().getList("orderNumber", String.class);
    }

    private String statusOf(String orderNumber) {
        return context.lastResponse().jsonPath()
                .getString("find { it.orderNumber == '" + orderNumber + "' }.status");
    }
}
