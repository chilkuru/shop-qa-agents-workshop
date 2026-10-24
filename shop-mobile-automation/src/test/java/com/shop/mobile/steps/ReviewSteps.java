package com.shop.mobile.steps;

import com.shop.mobile.context.ScenarioContext;
import com.shop.mobile.screens.CatalogScreen;
import com.shop.mobile.screens.HeaderScreen;
import com.shop.mobile.screens.ProductDetailScreen;
import com.shop.mobile.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.assertj.core.api.Assertions.assertThat;

public class ReviewSteps {

    private final ShopApi shop;
    private final CatalogScreen catalog;
    private final ProductDetailScreen detail;
    private final HeaderScreen header;
    private final ScenarioContext context;

    public ReviewSteps(ShopApi shop, CatalogScreen catalog, ProductDetailScreen detail,
                       HeaderScreen header, ScenarioContext context) {
        this.shop = shop;
        this.catalog = catalog;
        this.detail = detail;
        this.header = header;
        this.context = context;
    }

    @Given("I have reviewed {string} with {int} stars")
    public void iHaveReviewedWithStars(String product, int rating) {
        shop.submitReview(context.currentUserEmail(), product, rating);
    }

    @When("I review {string} with {int} stars")
    public void iReviewWithStars(String product, int rating) {
        catalog.awaitScreen();
        catalog.openProduct(product);
        detail.awaitScreen();
        detail.submitReview(rating, "A " + rating + "-star review");
    }

    @When("anyone views the reviews for {string}")
    public void anyoneViewsTheReviewsFor(String product) {
        header.logout();
        context.currentUserEmail(null);
        catalog.awaitScreen();
        catalog.openProduct(product);
        detail.awaitScreen();
    }

    @Then("{string} has {int} review")
    public void hasReview(String product, int expected) {
        assertThat(detail.reviewCount()).as("reviews on %s", product).isEqualTo(expected);
    }

    @Then("{string} has an average rating of {int}")
    public void hasAnAverageRatingOf(String product, int expected) {
        assertThat(detail.averageRating()).as("average for %s", product).isEqualTo(expected);
    }

    @Then("reviewing is not offered")
    public void reviewingIsNotOffered() {
        assertThat(detail.offersReviewing()).as("review form hidden").isFalse();
    }
}
