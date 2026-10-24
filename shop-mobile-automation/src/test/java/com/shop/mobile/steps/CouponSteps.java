package com.shop.mobile.steps;

import com.shop.mobile.context.ScenarioContext;
import com.shop.mobile.screens.CartScreen;
import com.shop.mobile.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.assertj.core.api.Assertions.assertThat;

public class CouponSteps {

    private final ShopApi shop;
    private final CartScreen cart;
    private final ScenarioContext context;

    public CouponSteps(ShopApi shop, CartScreen cart, ScenarioContext context) {
        this.shop = shop;
        this.cart = cart;
        this.context = context;
    }

    @Given("my cart contains {int} of {string}")
    public void myCartContainsOf(int quantity, String product) {
        shop.seedCartWith(context.currentUserEmail(), product, quantity);
    }

    @Given("I have applied coupon {string}")
    public void iHaveAppliedCoupon(String code) {
        cart.open();
        cart.applyCoupon(code);
        assertThat(cart.appliedCoupon()).isEqualTo(code);
    }

    @When("I apply coupon {string}")
    public void iApplyCoupon(String code) {
        cart.open();
        cart.applyCoupon(code);
    }

    @When("I remove the coupon")
    public void iRemoveTheCoupon() {
        cart.removeCoupon();
    }

    @Then("my cart shows a {int} percent discount")
    public void myCartShowsAPercentDiscount(int percent) {
        long expected = Math.round(cart.subtotalPaise() * (percent / 100.0));
        assertThat(cart.discountPaise()).isEqualTo(expected);
    }

    @Then("my cart total is the subtotal minus the discount")
    public void myCartTotalIsTheSubtotalMinusTheDiscount() {
        assertThat(cart.totalPaise()).isEqualTo(cart.subtotalPaise() - cart.discountPaise());
    }

    @Then("I am told the coupon cannot be used")
    public void iAmToldTheCouponCannotBeUsed() {
        assertThat(cart.showsCouponError()).as("coupon error shown").isTrue();
    }

    @Then("my cart has no discount")
    public void myCartHasNoDiscount() {
        assertThat(cart.discountPaise()).isZero();
        assertThat(cart.hasCouponApplied()).as("no coupon still applied").isFalse();
    }
}
