package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;

import static org.assertj.core.api.Assertions.assertThat;

public class ReviewSteps {

    private final ShopApi shop;
    private final ScenarioContext context;

    public ReviewSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @Given("I have reviewed {string} with {int} stars")
    public void iHaveReviewedWithStars(String product, int rating) {
        shop.review().submit(context.token(), shop.productId(product), rating, "Seeded review")
                .then().statusCode(200);
    }

    @When("I review {string} with {int} stars")
    public void iReviewWithStars(String product, int rating) {
        context.lastResponse(
                shop.review().submit(context.token(), shop.productId(product), rating, "A review"));
    }

    @When("anyone views the reviews for {string}")
    public void anyoneViewsTheReviewsFor(String product) {
        // Deliberately unauthenticated: reviews must be readable without signing in.
        context.lastResponse(shop.review().list(shop.productId(product)));
    }

    @Then("{string} has {int} review")
    public void hasNReviews(String product, int expected) {
        Response reviews = shop.review().list(shop.productId(product));
        assertThat(reviews.statusCode()).isEqualTo(200);
        assertThat(reviews.jsonPath().getInt("count")).isEqualTo(expected);
    }

    @Then("{string} has an average rating of {int}")
    public void hasAnAverageRatingOf(String product, int expected) {
        assertThat(shop.review().list(shop.productId(product)).jsonPath().getDouble("averageRating"))
                .isEqualTo((double) expected);
    }

    @Then("I am told only buyers can review")
    public void iAmToldOnlyBuyersCanReview() {
        assertThat(context.lastResponse().statusCode()).isEqualTo(400);
    }

    @Then("reviewing is not offered")
    public void reviewingIsNotOffered() {
        assertThat(context.lastResponse().jsonPath().getBoolean("canReview")).isFalse();
    }
}
