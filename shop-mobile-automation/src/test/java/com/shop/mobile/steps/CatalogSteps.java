package com.shop.mobile.steps;

import com.shop.mobile.screens.CatalogScreen;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.openqa.selenium.WebElement;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class CatalogSteps {

    private final CatalogScreen catalog;

    public CatalogSteps(CatalogScreen catalog) {
        this.catalog = catalog;
    }

    @When("I open the catalog")
    public void iOpenTheCatalog() {
        catalog.awaitScreen();
    }

    @When("I search the catalog for {string}")
    public void iSearchTheCatalogFor(String term) {
        catalog.awaitScreen();
        catalog.search(term);
    }

    @Given("I have searched the catalog for {string}")
    public void iHaveSearchedTheCatalogFor(String term) {
        iSearchTheCatalogFor(term);
    }

    @When("I filter the catalog by category {string}")
    public void iFilterTheCatalogByCategory(String category) {
        catalog.awaitScreen();
        catalog.filterByCategory(category);
    }

    @When("I clear the catalog filters")
    public void iClearTheCatalogFilters() {
        catalog.clearFilters();
    }

    @Then("I see {int} products")
    public void iSeeNProducts(int expected) {
        assertThat(catalog.reportedResultCount()).isEqualTo(expected);
    }

    @Then("I see {int} product")
    public void iSeeOneProduct(int expected) {
        iSeeNProducts(expected);
    }

    @Then("the results include {string}")
    public void theResultsInclude(String name) {
        assertThat(names()).contains(name);
    }

    @Then("every result belongs to category {string}")
    public void everyResultBelongsToCategory(String category) {
        List<String> categories = catalog.visibleProductCategories().stream()
                .map(WebElement::getText)
                .toList();

        assertThat(categories).isNotEmpty();
        assertThat(categories).allSatisfy(value -> assertThat(value).isEqualTo(category));
    }

    @Then("I am told no products matched")
    public void iAmToldNoProductsMatched() {
        assertThat(catalog.showsNoResults()).as("empty-state shown").isTrue();
        assertThat(catalog.reportedResultCount()).isZero();
    }

    private List<String> names() {
        return catalog.visibleProductNames().stream().map(WebElement::getText).toList();
    }
}
