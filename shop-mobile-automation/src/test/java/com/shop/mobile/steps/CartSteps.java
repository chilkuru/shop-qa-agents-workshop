package com.shop.mobile.steps;

import com.shop.mobile.context.ScenarioContext;
import com.shop.mobile.screens.CartScreen;
import com.shop.mobile.screens.CatalogScreen;
import com.shop.mobile.screens.ProductDetailScreen;
import com.shop.mobile.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.assertj.core.api.Assertions.assertThat;

public class CartSteps {

    private final ShopApi shop;
    private final CatalogScreen catalog;
    private final ProductDetailScreen detail;
    private final CartScreen cart;
    private final ScenarioContext context;

    public CartSteps(ShopApi shop, CatalogScreen catalog, ProductDetailScreen detail,
                     CartScreen cart, ScenarioContext context) {
        this.shop = shop;
        this.catalog = catalog;
        this.detail = detail;
        this.cart = cart;
        this.context = context;
    }

    @Given("my cart is empty")
    public void myCartIsEmpty() {
        shop.emptyCart(context.currentUserEmail());
    }

    @When("I add {string} to my cart")
    public void iAddToMyCart(String product) {
        catalog.awaitScreen();
        catalog.openProduct(product);
        detail.awaitScreen();
        detail.addToCart();
    }

    @Then("my cart contains {int} line")
    public void myCartContainsLines(int expected) {
        cart.open();
        assertThat(cart.lineCount()).isEqualTo(expected);
    }

    @Then("my cart shows {int} of {string}")
    public void myCartShowsOf(int quantity, String product) {
        cart.open();
        cart.awaitQuantity(product, quantity);
        assertThat(cart.quantityOf(product)).isEqualTo(quantity);
    }
}
