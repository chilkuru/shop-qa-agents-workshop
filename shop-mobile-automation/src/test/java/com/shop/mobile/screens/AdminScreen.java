package com.shop.mobile.screens;

import io.qameta.allure.Step;
import org.openqa.selenium.WebElement;

public class AdminScreen extends BaseScreen {

    public void awaitScreen() {
        visible("admin-screen");
        waitUntilGone("admin-loading");
    }

    @Step("Open catalog administration")
    public void open() {
        if (isPresent("admin-screen")) {
            awaitScreen();
            return;
        }
        tap("nav-admin");
        awaitScreen();
    }

    public boolean isForbidden() {
        return appears("admin-forbidden");
    }

    public int reportedCount() {
        return Integer.parseInt(textOf("admin-count").replaceAll("\\D+", ""));
    }

    @Step("Set the stock of {productName} to {stock}")
    public void setStock(String productName, int stock) {
        int id = productIdShownFor(productName);
        WebElement input = visible("admin-stock-input-" + id);
        input.clear();
        input.sendKeys(String.valueOf(stock));
        hideKeyboard();
        tap("admin-stock-save-" + id);
    }

    public String stockOf(String productName) {
        return textOf("admin-stock-" + productIdShownFor(productName));
    }

    @Step("Toggle the visibility of {productName}")
    public void toggleVisibility(String productName) {
        tap("admin-toggle-" + productIdShownFor(productName));
    }

    public String visibilityOf(String productName) {
        return textOf("admin-active-" + productIdShownFor(productName));
    }

    /** The admin list is virtualised, so a product further down must be scrolled into view. */
    private int productIdShownFor(String productName) {
        for (WebElement element : allSettled(byTestIdStartsWith("admin-name-"))) {
            if (productName.equalsIgnoreCase(element.getText())) {
                return idOf(element);
            }
        }
        return idOf(scrollIntoViewByText(productName));
    }

    private static int idOf(WebElement nameElement) {
        String resourceId = nameElement.getAttribute("resource-id");
        return Integer.parseInt(resourceId.substring(resourceId.lastIndexOf('-') + 1));
    }
}
