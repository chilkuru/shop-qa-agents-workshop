package com.shop.mobile.steps;

import com.shop.mobile.context.ScenarioContext;
import com.shop.mobile.screens.CatalogScreen;
import com.shop.mobile.screens.HeaderScreen;
import com.shop.mobile.screens.LoginScreen;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.assertj.core.api.Assertions.assertThat;

public class RegistrationSteps {

    private static final String NEW_PASSWORD = "Newcomer@12345";

    private final HeaderScreen header;
    private final LoginScreen login;
    private final CatalogScreen catalog;
    private final ScenarioContext context;

    public RegistrationSteps(HeaderScreen header, LoginScreen login,
                             CatalogScreen catalog, ScenarioContext context) {
        this.header = header;
        this.login = login;
        this.catalog = catalog;
        this.context = context;
    }

    @Given("{string} has no account")
    public void hasNoAccount(String email) {
        // The suite must be re-runnable, so each run registers a distinct address.
        int at = email.indexOf('@');
        context.registeredEmail(email.substring(0, at) + "+" + System.nanoTime() + email.substring(at));
    }

    @When("I register as {string}")
    public void iRegisterAs(String email) {
        String target = context.registeredEmail() != null ? context.registeredEmail() : email;

        catalog.awaitScreen();
        header.openLogin();
        login.awaitScreen();
        login.switchToRegister();
        login.register(target, NEW_PASSWORD, "New Comer");

        context.currentUserEmail(target);
    }

    @When("I attempt to register as {string}")
    public void iAttemptToRegisterAs(String email) {
        catalog.awaitScreen();
        header.openLogin();
        login.awaitScreen();
        login.switchToRegister();
        login.register(email, NEW_PASSWORD, "Duplicate");
    }

    @Then("I am told the email is already registered")
    public void iAmToldTheEmailIsAlreadyRegistered() {
        assertThat(login.hasError()).as("registration error shown").isTrue();
    }
}
