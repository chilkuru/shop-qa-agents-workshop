package com.shop.api.context;

import io.restassured.response.Response;

/**
 * Per-scenario state, wired by PicoContainer. Must be a public top-level class with a
 * no-arg constructor or the container cannot satisfy step-definition dependencies.
 */
public class ScenarioContext {

    private String token;
    private String currentUserEmail;
    private Response lastResponse;
    private String lastOrderNumber;
    private Integer orderCountBeforeCheckout;
    private String pendingEmail;
    private String otherShopperOrderNumber;

    public String token() {
        return token;
    }

    public void token(String value) {
        this.token = value;
    }

    public boolean isSignedIn() {
        return token != null && !token.isBlank();
    }

    public void signOut() {
        this.token = null;
    }

    public String currentUserEmail() {
        return currentUserEmail;
    }

    public void currentUserEmail(String value) {
        this.currentUserEmail = value;
    }

    public Response lastResponse() {
        if (lastResponse == null) {
            throw new IllegalStateException("No request has been made in this scenario yet");
        }
        return lastResponse;
    }

    public void lastResponse(Response value) {
        this.lastResponse = value;
    }

    public String lastOrderNumber() {
        return lastOrderNumber;
    }

    public void lastOrderNumber(String value) {
        this.lastOrderNumber = value;
    }

    public Integer orderCountBeforeCheckout() {
        if (orderCountBeforeCheckout == null) {
            throw new IllegalStateException("No checkout was attempted in this scenario");
        }
        return orderCountBeforeCheckout;
    }

    public void orderCountBeforeCheckout(int value) {
        this.orderCountBeforeCheckout = value;
    }

    public String pendingEmail() {
        return pendingEmail;
    }

    public void pendingEmail(String value) {
        this.pendingEmail = value;
    }

    public String otherShopperOrderNumber() {
        return otherShopperOrderNumber;
    }

    public void otherShopperOrderNumber(String value) {
        this.otherShopperOrderNumber = value;
    }
}
