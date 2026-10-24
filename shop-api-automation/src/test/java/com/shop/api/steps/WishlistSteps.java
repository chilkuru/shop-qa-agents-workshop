package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class WishlistSteps {

    private final ShopApi shop;
    private final ScenarioContext context;

    public WishlistSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @Given("my wishlist is empty")
    public void myWishlistIsEmpty() {
        for (String name : savedNames()) {
            shop.wishlist().remove(context.token(), shop.productId(name));
        }
    }

    @Given("I have saved {string} for later")
    public void iHaveSavedForLater(String product) {
        shop.wishlist().add(context.token(), shop.productId(product)).then().statusCode(200);
    }

    @When("I save {string} for later")
    public void iSaveForLater(String product) {
        context.lastResponse(shop.wishlist().add(context.token(), shop.productId(product)));
    }

    @When("I remove {string} from my wishlist")
    public void iRemoveFromMyWishlist(String product) {
        context.lastResponse(shop.wishlist().remove(context.token(), shop.productId(product)));
    }

    @Then("my wishlist holds {int} product")
    public void myWishlistHoldsNProducts(int expected) {
        assertThat(savedNames()).hasSize(expected);
    }

    @Then("my wishlist includes {string}")
    public void myWishlistIncludes(String product) {
        assertThat(savedNames()).contains(product);
    }

    @Then("my wishlist is now empty")
    public void myWishlistIsNowEmpty() {
        assertThat(savedNames()).isEmpty();
    }

    @Then("I am told the product was not saved")
    public void iAmToldTheProductWasNotSaved() {
        assertThat(context.lastResponse().statusCode()).isEqualTo(404);
    }

    private List<String> savedNames() {
        return shop.wishlist().get(context.token()).jsonPath().getList("items.name", String.class);
    }
}
