package com.shop.mobile.screens;

import io.qameta.allure.Step;

public class OrdersScreen extends BaseScreen {

    public void awaitScreen() {
        visible("orders-screen");
        waitUntilGone("orders-loading");
    }

    @Step("Open order history")
    public void open() {
        tap("nav-orders");
        awaitScreen();
    }

    public boolean showsOrder(String orderNumber) {
        return appears("order-row-" + orderNumber);
    }

    public String statusOf(String orderNumber) {
        return textOf("order-status-" + orderNumber);
    }

    public boolean isEmpty() {
        return appears("orders-empty");
    }
}
