package com.shop.mobile.screens;

import io.qameta.allure.Step;

public class LoginScreen extends BaseScreen {

    @Step("Sign in as {email}")
    public void signIn(String email, String password) {
        visible("email-input").clear();
        visible("email-input").sendKeys(email);
        visible("password-input").clear();
        visible("password-input").sendKeys(password);
        tap("submit-button");
    }

    public boolean isShowing() {
        return isPresent("login-screen");
    }

    public boolean hasError() {
        return isPresent("login-error");
    }

    public void awaitScreen() {
        visible("login-screen");
    }

    @Step("Switch to the register form")
    public void switchToRegister() {
        tap("toggle-mode-button");
        visible("fullname-input");
    }

    @Step("Register {email}")
    public void register(String email, String password, String fullName) {
        visible("fullname-input").clear();
        visible("fullname-input").sendKeys(fullName);
        visible("email-input").clear();
        visible("email-input").sendKeys(email);
        visible("password-input").clear();
        visible("password-input").sendKeys(password);
        tap("submit-button");
    }
}
