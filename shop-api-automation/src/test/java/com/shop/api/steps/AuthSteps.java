package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.fixtures.Fixtures;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;

import static org.assertj.core.api.Assertions.assertThat;

public class AuthSteps {

    private final ShopApi shop;
    private final ScenarioContext context;

    public AuthSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @Given("I am a registered shopper {string}")
    public void iAmARegisteredShopper(String email) {
        shop.ensureUser(Fixtures.userByEmail(email));
    }

    @Given("I am signed in as {string}")
    public void iAmSignedInAs(String email) {
        Fixtures.User user = Fixtures.userByEmail(email);
        shop.ensureUser(user);
        context.token(shop.signIn(user.email(), user.password()));
        context.currentUserEmail(user.email());
    }

    @When("I sign in as {string}")
    public void iSignInAs(String email) {
        Fixtures.User user = Fixtures.userByEmail(email);
        Response response = shop.auth().login(user.email(), user.password());
        context.lastResponse(response);
        if (response.statusCode() == 200) {
            context.token(response.jsonPath().getString("token"));
            context.currentUserEmail(user.email());
        }
    }

    @When("I attempt to sign in as {string} with the wrong password")
    public void iAttemptToSignInWithTheWrongPassword(String email) {
        Response response = shop.auth().login(email, Fixtures.wrongPassword());
        context.lastResponse(response);
        context.signOut();
    }

    @When("I sign out")
    public void iSignOut() {
        context.lastResponse(shop.auth().logout(context.token()));
        context.signOut();
    }

    @When("I request my cart")
    public void iRequestMyCart() {
        context.lastResponse(shop.cart().get(context.token()));
    }

    @Then("I am recognised as {string}")
    public void iAmRecognisedAs(String email) {
        assertThat(context.isSignedIn()).as("a token was issued").isTrue();

        // Registration scenarios use a per-run unique address, so the literal in the
        // Gherkin is a placeholder for whichever account was actually created.
        String expected = context.pendingEmail() != null ? context.pendingEmail() : email;

        Response me = shop.auth().me(context.token());
        assertThat(me.statusCode()).isEqualTo(200);
        assertThat(me.jsonPath().getString("email")).isEqualToIgnoringCase(expected);
    }

    @Then("I am told the credentials are invalid")
    public void iAmToldTheCredentialsAreInvalid() {
        assertThat(context.lastResponse().statusCode()).isIn(400, 401);
    }

    @Then("I am no longer signed in")
    public void iAmNoLongerSignedIn() {
        assertThat(context.isSignedIn()).as("no active token").isFalse();
    }

    @Then("the request is refused as unauthorised")
    public void theRequestIsRefusedAsUnauthorised() {
        assertThat(context.lastResponse().statusCode()).isIn(401, 403);
    }
}
