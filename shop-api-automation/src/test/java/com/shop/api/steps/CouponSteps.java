package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;

import static org.assertj.core.api.Assertions.assertThat;

public class CouponSteps {

    private final ShopApi shop;
    private final ScenarioContext context;

    public CouponSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @Given("I have applied coupon {string}")
    public void iHaveAppliedCoupon(String code) {
        shop.cart().applyCoupon(context.token(), code).then().statusCode(200);
    }

    @When("I apply coupon {string}")
    public void iApplyCoupon(String code) {
        context.lastResponse(shop.cart().applyCoupon(context.token(), code));
    }

    @When("I remove the coupon")
    public void iRemoveTheCoupon() {
        context.lastResponse(shop.cart().removeCoupon(context.token()));
    }

    @Then("my cart shows a {int} percent discount")
    public void myCartShowsAPercentDiscount(int percent) {
        Response cart = context.lastResponse();
        assertThat(cart.statusCode()).isEqualTo(200);

        int subtotal = cart.jsonPath().getInt("subtotalPaise");
        assertThat(cart.jsonPath().getInt("discountPaise"))
                .isEqualTo(Math.round(subtotal * (percent / 100f)));
    }

    @Then("my cart total is the subtotal minus the discount")
    public void myCartTotalIsTheSubtotalMinusTheDiscount() {
        Response cart = context.lastResponse();
        assertThat(cart.jsonPath().getInt("totalPaise"))
                .isEqualTo(cart.jsonPath().getInt("subtotalPaise") - cart.jsonPath().getInt("discountPaise"));
    }

    @Then("I am told the coupon cannot be used")
    public void iAmToldTheCouponCannotBeUsed() {
        assertThat(context.lastResponse().statusCode()).isEqualTo(400);
    }

    @Then("my cart has no discount")
    public void myCartHasNoDiscount() {
        Response cart = shop.cart().get(context.token());
        assertThat(cart.jsonPath().getInt("discountPaise")).isZero();
        assertThat(cart.jsonPath().getString("couponCode")).isNull();
    }
}
