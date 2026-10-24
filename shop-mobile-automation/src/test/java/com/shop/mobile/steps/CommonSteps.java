package com.shop.mobile.steps;

import com.shop.mobile.screens.CatalogScreen;
import com.shop.mobile.support.ShopApi;
import io.cucumber.java.en.Given;

import static org.assertj.core.api.Assertions.assertThat;

public class CommonSteps {

    private final ShopApi shop;
    private final CatalogScreen catalog;

    public CommonSteps(ShopApi shop, CatalogScreen catalog) {
        this.shop = shop;
        this.catalog = catalog;
    }

    @Given("the shop is available")
    public void theShopIsAvailable() {
        assertThat(shop.isHealthy())
                .as("backend reachable with test-support enabled")
                .isTrue();
        catalog.awaitScreen();
    }

    @Given("the catalog is seeded with the demo products")
    public void theCatalogIsSeeded() {
        assertThat(shop.catalogIsSeeded()).isTrue();
    }

    @Given("I am not signed in")
    public void iAmNotSignedIn() {
        catalog.awaitScreen();
    }
}
