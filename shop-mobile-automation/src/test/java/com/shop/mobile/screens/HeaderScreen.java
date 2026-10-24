package com.shop.mobile.screens;

import io.qameta.allure.Step;

public class HeaderScreen extends BaseScreen {

    @Step("Open the login screen")
    public void openLogin() {
        tap("nav-login");
    }

    @Step("Log out")
    public void logout() {
        tap("logout-button");
    }

    public boolean isSignedIn() {
        return appears("logout-button");
    }

    public boolean isSignedOut() {
        return appears("nav-login");
    }

    public String currentUser() {
        return textOf("current-user");
    }
}
