package com.shop.mobile.steps;

import com.shop.mobile.context.ScenarioContext;
import com.shop.mobile.screens.CatalogScreen;
import com.shop.mobile.screens.ProductDetailScreen;
import com.shop.mobile.screens.WishlistScreen;
import com.shop.mobile.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.assertj.core.api.Assertions.assertThat;

public class WishlistSteps {

    private final ShopApi shop;
    private final CatalogScreen catalog;
    private final ProductDetailScreen detail;
    private final WishlistScreen wishlist;
    private final ScenarioContext context;

    public WishlistSteps(ShopApi shop, CatalogScreen catalog, ProductDetailScreen detail,
                         WishlistScreen wishlist, ScenarioContext context) {
        this.shop = shop;
        this.catalog = catalog;
        this.detail = detail;
        this.wishlist = wishlist;
        this.context = context;
    }

    @Given("my wishlist is empty")
    public void myWishlistIsEmpty() {
        shop.clearWishlist(context.currentUserEmail());
    }

    @Given("I have saved {string} for later")
    public void iHaveSavedForLater(String product) {
        shop.saveToWishlist(context.currentUserEmail(), product);
    }

    @When("I save {string} for later")
    public void iSaveForLater(String product) {
        catalog.awaitScreen();
        catalog.openProduct(product);
        detail.awaitScreen();
        detail.saveForLater();
    }

    @Then("my wishlist holds {int} product")
    public void myWishlistHoldsProducts(int expected) {
        wishlist.open();
        assertThat(wishlist.reportedCount()).isEqualTo(expected);
    }

    @Then("my wishlist includes {string}")
    public void myWishlistIncludes(String product) {
        assertThat(wishlist.includes(product)).as("%s saved", product).isTrue();
    }

    @When("I remove {string} from my wishlist")
    public void iRemoveFromMyWishlist(String product) {
        wishlist.open();
        wishlist.remove(product);
    }

    @Then("my wishlist is now empty")
    public void myWishlistIsNowEmpty() {
        assertThat(wishlist.isEmpty()).as("empty-state shown").isTrue();
    }
}
