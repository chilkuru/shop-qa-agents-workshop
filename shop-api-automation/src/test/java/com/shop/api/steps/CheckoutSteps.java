package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.fixtures.Fixtures;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;

import static org.assertj.core.api.Assertions.assertThat;

public class CheckoutSteps {

    private final ShopApi shop;
    private final ScenarioContext context;

    public CheckoutSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @When("I check out with the approved card")
    public void iCheckOutWithTheApprovedCard() {
        checkOutWith("approved");
    }

    @When("I check out with the declined card")
    public void iCheckOutWithTheDeclinedCard() {
        checkOutWith("declined");
    }

    @When("I check out with the insufficient-funds card")
    public void iCheckOutWithTheInsufficientFundsCard() {
        checkOutWith("insufficientFunds");
    }

    @Then("my order is confirmed")
    public void myOrderIsConfirmed() {
        Response response = context.lastResponse();
        assertThat(response.statusCode()).isEqualTo(201);
        assertThat(response.jsonPath().getString("status")).isEqualTo("CONFIRMED");
    }

    @Then("I am given an order number")
    public void iAmGivenAnOrderNumber() {
        String orderNumber = context.lastResponse().jsonPath().getString("orderNumber");
        assertThat(orderNumber).isNotBlank();
        context.lastOrderNumber(orderNumber);
    }

    @Then("the payment is declined")
    public void thePaymentIsDeclined() {
        assertThat(context.lastResponse().statusCode()).isEqualTo(400);
    }

    @Then("no order is placed")
    public void noOrderIsPlaced() {
        Response orders = shop.order().orders(context.token());
        assertThat(orders.statusCode()).isEqualTo(200);
        assertThat(orders.jsonPath().getList("$"))
                .as("order count must be unchanged by a failed checkout")
                .hasSize(context.orderCountBeforeCheckout());
    }

    @Then("I am told the cart is empty")
    public void iAmToldTheCartIsEmpty() {
        assertThat(context.lastResponse().statusCode()).isEqualTo(400);
    }

    private void checkOutWith(String cardKey) {
        // Captured up front so a failed checkout can be shown to have added nothing,
        // regardless of orders the account already had.
        context.orderCountBeforeCheckout(
                shop.order().orders(context.token()).jsonPath().getList("$").size());

        Response response = shop.order().checkout(
                context.token(), Fixtures.card(cardKey), Fixtures.shipping());
        context.lastResponse(response);

        // Recorded here rather than in an assertion step, so scenarios that never assert
        // on the number can still refer to the order they just placed.
        if (response.statusCode() == 201) {
            context.lastOrderNumber(response.jsonPath().getString("orderNumber"));
        }
    }
}
