package com.shop.mobile.steps;

import com.shop.mobile.context.ScenarioContext;
import com.shop.mobile.screens.OrdersScreen;
import com.shop.mobile.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.assertj.core.api.Assertions.assertThat;

public class OrderHistorySteps {

    private final ShopApi shop;
    private final OrdersScreen orders;
    private final ScenarioContext context;

    public OrderHistorySteps(ShopApi shop, OrdersScreen orders, ScenarioContext context) {
        this.shop = shop;
        this.orders = orders;
        this.context = context;
    }

    @Given("I have already placed an order for {string}")
    public void iHaveAlreadyPlacedAnOrderFor(String product) {
        // Seeded through the API on purpose: order history must not re-test checkout.
        context.lastOrderNumber(shop.placeOrder(context.currentUserEmail(), product));
    }

    @Given("I have no order history")
    public void iHaveNoOrderHistory() {
        shop.resetOrders(context.currentUserEmail());
    }

    @When("I open my order history")
    public void iOpenMyOrderHistory() {
        orders.open();
    }

    @Then("my most recent order is listed as confirmed")
    public void myMostRecentOrderIsListedAsConfirmed() {
        String orderNumber = context.lastOrderNumber();
        assertThat(orders.showsOrder(orderNumber)).as("order %s listed", orderNumber).isTrue();
        assertThat(orders.statusOf(orderNumber)).isEqualTo("CONFIRMED");
    }

    @Then("I am told I have no orders")
    public void iAmToldIHaveNoOrders() {
        assertThat(orders.isEmpty()).as("empty-state shown").isTrue();
    }
}
