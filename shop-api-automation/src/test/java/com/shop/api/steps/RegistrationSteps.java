package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.fixtures.Fixtures;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;

import static org.assertj.core.api.Assertions.assertThat;

public class RegistrationSteps {

    private static final String NEW_PASSWORD = "Newcomer@12345";

    private final ShopApi shop;
    private final ScenarioContext context;

    public RegistrationSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @Given("{string} has no account")
    public void hasNoAccount(String email) {
        // The suite must be re-runnable, so the address is made unique per run rather
        // than relying on a destructive global reset.
        context.pendingEmail(uniqueVariantOf(email));
    }

    @When("I register as {string}")
    public void iRegisterAs(String email) {
        String target = context.pendingEmail() != null ? context.pendingEmail() : email;
        Response response = shop.auth().register(target, NEW_PASSWORD, "New Comer");
        context.lastResponse(response);

        if (response.statusCode() == 200 || response.statusCode() == 201) {
            context.token(response.jsonPath().getString("token"));
            context.currentUserEmail(target);
        }
    }

    @When("I attempt to register as {string}")
    public void iAttemptToRegisterAs(String email) {
        Fixtures.User existing = Fixtures.userByEmail(email);
        context.lastResponse(shop.auth().register(existing.email(), NEW_PASSWORD, "Duplicate"));
    }

    @Then("I am told the email is already registered")
    public void iAmToldTheEmailIsAlreadyRegistered() {
        assertThat(context.lastResponse().statusCode()).isIn(400, 409);
    }

    private static String uniqueVariantOf(String email) {
        int at = email.indexOf('@');
        return email.substring(0, at) + "+" + System.nanoTime() + email.substring(at);
    }
}
