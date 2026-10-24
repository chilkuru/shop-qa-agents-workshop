package com.shop.mobile.steps;

import com.shop.mobile.screens.AdminScreen;
import com.shop.mobile.screens.CatalogScreen;
import com.shop.mobile.support.ShopApi;
import io.cucumber.java.Before;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.assertj.core.api.Assertions.assertThat;

public class AdminSteps {

    private final ShopApi shop;
    private final AdminScreen admin;
    private final CatalogScreen catalog;

    public AdminSteps(ShopApi shop, AdminScreen admin, CatalogScreen catalog) {
        this.shop = shop;
        this.admin = admin;
        this.catalog = catalog;
    }

    /** A run that dies mid-scenario can leave a product hidden or short-stocked. */
    @Before("@ADMIN-01")
    public void restoreCatalogState() {
        shop.restoreProduct("Wireless Mouse", 40);
        shop.restoreProduct("Mechanical Keyboard", 40);
    }

    @When("I open the product administration list")
    public void iOpenTheProductAdministrationList() {
        admin.open();
    }

    @Then("I see all {int} products including hidden ones")
    public void iSeeAllProductsIncludingHiddenOnes(int expected) {
        assertThat(admin.reportedCount()).isEqualTo(expected);
    }

    @Then("the request is refused as forbidden")
    public void theRequestIsRefusedAsForbidden() {
        assertThat(admin.isForbidden()).as("forbidden notice shown").isTrue();
    }

    @When("I set the stock of {string} to {int}")
    public void iSetTheStockOfTo(String product, int stock) {
        admin.open();
        admin.setStock(product, stock);
    }

    @Then("{string} reports {int} in stock")
    public void reportsInStock(String product, int expected) {
        assertThat(admin.stockOf(product)).isEqualTo(String.valueOf(expected));
    }

    @When("I hide {string} from the catalog")
    public void iHideFromTheCatalog(String product) {
        admin.open();
        admin.toggleVisibility(product);
        assertThat(admin.visibilityOf(product)).isEqualTo("Hidden");
    }

    @Then("the shopper catalog holds {int} products")
    public void theShopperCatalogHoldsProducts(int expected) {
        catalog.open();
        assertThat(catalog.reportedResultCount()).isEqualTo(expected);
    }

    @Then("restoring {string} brings the catalog back to {int}")
    public void restoringBringsTheCatalogBackTo(String product, int expected) {
        admin.open();
        admin.toggleVisibility(product);
        assertThat(admin.visibilityOf(product)).isEqualTo("Visible");

        catalog.open();
        assertThat(catalog.reportedResultCount()).isEqualTo(expected);
    }
}
