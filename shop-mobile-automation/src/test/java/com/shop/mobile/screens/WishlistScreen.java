package com.shop.mobile.screens;

import io.qameta.allure.Step;
import org.openqa.selenium.WebElement;

import java.util.List;

public class WishlistScreen extends BaseScreen {

    public void awaitScreen() {
        visible("wishlist-screen");
        waitUntilGone("wishlist-loading");
    }

    @Step("Open the wishlist")
    public void open() {
        if (isPresent("wishlist-screen")) {
            awaitScreen();
            return;
        }
        tap("nav-wishlist");
        awaitScreen();
    }

    /** The list is virtualised, so the app's own count is the reliable size. */
    public int reportedCount() {
        return Integer.parseInt(textOf("wishlist-count").replaceAll("\\D+", ""));
    }

    public boolean includes(String productName) {
        for (WebElement element : visibleNames()) {
            if (productName.equalsIgnoreCase(element.getText())) return true;
        }
        return false;
    }

    @Step("Remove {productName} from the wishlist")
    public void remove(String productName) {
        tap("wishlist-remove-" + productIdShownFor(productName));
    }

    public boolean isEmpty() {
        return appears("wishlist-empty");
    }

    private List<WebElement> visibleNames() {
        return allSettled(byTestIdStartsWith("wishlist-name-"));
    }

    private int productIdShownFor(String productName) {
        for (WebElement element : visibleNames()) {
            if (productName.equalsIgnoreCase(element.getText())) {
                String resourceId = element.getAttribute("resource-id");
                return Integer.parseInt(resourceId.substring(resourceId.lastIndexOf('-') + 1));
            }
        }
        throw new IllegalArgumentException("No wishlist row for '" + productName + "'");
    }
}
