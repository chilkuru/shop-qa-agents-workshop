package com.shop.mobile.context;

/** Per-scenario state, wired by PicoContainer. */
public class ScenarioContext {

    private String currentUserEmail;
    private String registeredEmail;
    private String lastOrderNumber;

    public String currentUserEmail() {
        return currentUserEmail;
    }

    public void currentUserEmail(String value) {
        this.currentUserEmail = value;
    }

    public String registeredEmail() {
        return registeredEmail;
    }

    public void registeredEmail(String value) {
        this.registeredEmail = value;
    }

    public String lastOrderNumber() {
        return lastOrderNumber;
    }

    public void lastOrderNumber(String value) {
        this.lastOrderNumber = value;
    }
}
