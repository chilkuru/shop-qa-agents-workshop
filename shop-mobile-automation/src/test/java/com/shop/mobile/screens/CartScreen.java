package com.shop.mobile.screens;

import io.qameta.allure.Step;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebElement;

import java.util.List;

public class CartScreen extends BaseScreen {

    public void awaitScreen() {
        visible("cart-screen");
        waitUntilGone("cart-loading");
    }

    @Step("Open the cart")
    public void open() {
        if (isPresent("cart-screen")) {
            awaitScreen();
            return;
        }
        tap("nav-cart");
        awaitScreen();
    }

    @Step("Apply coupon {code}")
    public void applyCoupon(String code) {
        WebElement input = visible("coupon-input");
        input.clear();
        input.sendKeys(code);
        hideKeyboard();
        tap("coupon-apply");
    }

    @Step("Remove the coupon")
    public void removeCoupon() {
        tap("coupon-remove");
    }

    public String appliedCoupon() {
        return textOf("cart-coupon-code");
    }

    public boolean hasCouponApplied() {
        return isPresent("cart-coupon-code");
    }

    public boolean showsCouponError() {
        return appears("coupon-error");
    }

    public long subtotalPaise() {
        return paise("cart-subtotal");
    }

    public long discountPaise() {
        return paise("cart-discount");
    }

    public long totalPaise() {
        return paise("cart-total");
    }

    public int lineCount() {
        return allSettled(byTestIdStartsWith("cart-row-")).size();
    }

    public int quantityOf(String productName) {
        return Integer.parseInt(textOf("cart-quantity-" + lineIdFor(productName)).trim());
    }

    /** The cart refetches after a mutation, so the line may briefly show its old quantity. */
    public void awaitQuantity(String productName, int expected) {
        try {
            waiter().ignoring(StaleElementReferenceException.class).until(driver -> {
                for (WebElement name : all(byTestIdStartsWith("cart-name-"))) {
                    if (productName.equalsIgnoreCase(name.getText())) {
                        String id = idSuffix(name);
                        List<WebElement> qty = all(byTestId("cart-quantity-" + id));
                        return !qty.isEmpty()
                                && String.valueOf(expected).equals(qty.get(0).getText().trim());
                    }
                }
                return false;
            });
        } catch (TimeoutException notReached) {
            // The caller asserts on the value actually shown.
        }
    }

    private String lineIdFor(String productName) {
        for (WebElement element : allSettled(byTestIdStartsWith("cart-name-"))) {
            if (productName.equalsIgnoreCase(element.getText())) {
                return idSuffix(element);
            }
        }
        throw new IllegalArgumentException("No cart line for '" + productName + "'");
    }

    private static String idSuffix(WebElement element) {
        String resourceId = element.getAttribute("resource-id");
        return resourceId.substring(resourceId.lastIndexOf('-') + 1);
    }

    /** Money renders as INR text, so the digits are read back as paise. */
    private long paise(String testId) {
        return Long.parseLong(textOf(testId).replaceAll("\\D+", "")) * 100L;
    }
}
