package com.shop.mobile.screens;

import com.shop.mobile.driver.DriverManager;
import io.qameta.allure.Step;
import org.openqa.selenium.WebElement;

import java.util.List;

public class CatalogScreen extends BaseScreen {

    public void awaitScreen() {
        visible("catalog-screen");
        waitUntilGone("catalog-loading");
    }

    /**
     * Catalog is the navigation root, so it is reached by popping the stack. Any search
     * left over from openProduct is cleared, otherwise the result count is still filtered.
     */
    @Step("Return to the catalog")
    public void open() {
        for (int pops = 0; pops < 5 && !isPresent("catalog-screen"); pops++) {
            DriverManager.get().navigate().back();
        }
        awaitScreen();
        if (isPresent("clear-filters-button")) {
            clearFilters();
            awaitScreen();
        }
    }

    @Step("Search the catalog for {term}")
    public void search(String term) {
        visible("search-input").clear();
        visible("search-input").sendKeys(term);
        tap("search-button");
    }

    @Step("Filter by category {category}")
    public void filterByCategory(String category) {
        tap("category-" + category);
    }

    @Step("Clear the catalog filters")
    public void clearFilters() {
        tap("clear-filters-button");
    }

    /**
     * The list is virtualised, so only mounted rows are queryable. The result count is
     * the app's own report of how many products matched.
     */
    public int reportedResultCount() {
        String text = textOf("result-count");
        return Integer.parseInt(text.replaceAll("\\D+", ""));
    }

    public List<WebElement> visibleProductNames() {
        return allSettled(byTestIdStartsWith("product-name-"));
    }

    public List<WebElement> visibleProductCategories() {
        return allSettled(byTestIdStartsWith("product-category-"));
    }

    @Step("Open the product {productName}")
    public void openProduct(String productName) {
        // The list is virtualised, so a product further down is not mounted and cannot be
        // located. Searching brings it into the rendered window first.
        search(productName);
        int id = productIdShownFor(productName);
        tap("product-link-" + id);
    }

    /** Cards are keyed by product id, so the visible name is mapped back to it. */
    private int productIdShownFor(String productName) {
        for (WebElement element : allSettled(byTestIdStartsWith("product-name-"))) {
            if (productName.equalsIgnoreCase(element.getText())) {
                String resourceId = element.getAttribute("resource-id");
                return Integer.parseInt(resourceId.substring(resourceId.lastIndexOf('-') + 1));
            }
        }
        throw new IllegalArgumentException("No visible product card for '" + productName + "'");
    }

    public boolean showsNoResults() {
        return appears("no-results");
    }
}
