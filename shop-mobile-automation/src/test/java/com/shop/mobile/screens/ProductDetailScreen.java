package com.shop.mobile.screens;

import io.qameta.allure.Step;
import org.openqa.selenium.WebElement;

public class ProductDetailScreen extends BaseScreen {

    public void awaitScreen() {
        visible("product-detail-screen");
        waitUntilGone("product-loading");
    }

    @Step("Read the product name")
    public String name() {
        return textOf("detail-name");
    }

    public String category() {
        return textOf("detail-category");
    }

    public String price() {
        return textOf("detail-price");
    }

    public String stock() {
        return textOf("detail-stock");
    }

    public String sku() {
        return textOf("detail-sku");
    }

    @Step("Add the product to the cart")
    public void addToCart() {
        tap("detail-add-to-cart");
    }

    @Step("Save the product for later")
    public void saveForLater() {
        tap("detail-save-for-later");
    }

    public int reviewCount() {
        scrollIntoView("reviews-count");
        return Integer.parseInt(textOf("reviews-count").replaceAll("\\D+", ""));
    }

    public double averageRating() {
        scrollIntoView("reviews-average");
        return Double.parseDouble(textOf("reviews-average").replaceAll("[^0-9.]", ""));
    }

    public boolean offersReviewing() {
        return isPresent("review-form");
    }

    @Step("Review the product with {rating} stars")
    public void submitReview(int rating, String comment) {
        // The form sits below the reviews list, so it is off-screen until scrolled to.
        scrollIntoView("review-rating-input");
        WebElement ratingInput = visible("review-rating-input");
        ratingInput.clear();
        ratingInput.sendKeys(String.valueOf(rating));

        WebElement commentInput = visible("review-comment-input");
        commentInput.clear();
        commentInput.sendKeys(comment);

        // The soft keyboard covers the submit button once both fields have been typed into.
        hideKeyboard();
        scrollIntoView("review-submit");
        tap("review-submit");
    }
}
