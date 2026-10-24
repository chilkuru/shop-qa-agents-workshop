package com.shop.mobile.steps;

import com.shop.mobile.context.ScenarioContext;
import com.shop.mobile.fixtures.Fixtures;
import com.shop.mobile.screens.CatalogScreen;
import com.shop.mobile.screens.ProductDetailScreen;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.text.NumberFormat;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

public class ProductSteps {

    private final CatalogScreen catalog;
    private final ProductDetailScreen detail;

    public ProductSteps(CatalogScreen catalog, ProductDetailScreen detail, ScenarioContext context) {
        this.catalog = catalog;
        this.detail = detail;
    }

    @When("I open the product {string}")
    public void iOpenTheProduct(String name) {
        catalog.awaitScreen();
        catalog.openProduct(name);
        detail.awaitScreen();
    }

    @Then("I see the product details for {string}")
    public void iSeeTheProductDetailsFor(String name) {
        assertThat(detail.name()).isEqualTo(name);
        assertThat(detail.sku()).isNotBlank();
    }

    @Then("the product shows the price of {int} {string}")
    public void theProductShowsThePriceOf(int quantity, String name) {
        assertThat(detail.price()).isEqualTo(formatPaise(Fixtures.pricePaise(name) * quantity));
    }

    @Then("the product belongs to category {string}")
    public void theProductBelongsToCategory(String category) {
        assertThat(detail.category()).isEqualTo(category);
    }

    @Then("the product is shown as in stock")
    public void theProductIsShownAsInStock() {
        assertThat(detail.stock()).isEqualTo("In stock");
    }

    private static String formatPaise(long paise) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("en-IN"));
        format.setMaximumFractionDigits(0);
        return format.format(paise / 100.0);
    }
}
