package com.shop.mobile.steps;

import com.shop.mobile.context.ScenarioContext;
import com.shop.mobile.fixtures.Fixtures;
import com.shop.mobile.screens.CatalogScreen;
import com.shop.mobile.screens.HeaderScreen;
import com.shop.mobile.screens.LoginScreen;
import com.shop.mobile.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.assertj.core.api.Assertions.assertThat;

public class AuthSteps {

    private final ShopApi shop;
    private final HeaderScreen header;
    private final LoginScreen login;
    private final CatalogScreen catalog;
    private final ScenarioContext context;

    public AuthSteps(ShopApi shop, HeaderScreen header, LoginScreen login,
                     CatalogScreen catalog, ScenarioContext context) {
        this.shop = shop;
        this.header = header;
        this.login = login;
        this.catalog = catalog;
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

        catalog.awaitScreen();
        // A scenario may switch users after the Background has already signed one in,
        // in which case the header offers "Log out" and there is no login affordance.
        if (header.isSignedIn()) {
            header.logout();
            catalog.awaitScreen();
        }
        header.openLogin();
        login.awaitScreen();
        login.signIn(user.email(), user.password());

        catalog.awaitScreen();
        context.currentUserEmail(user.email());
    }

    @When("I sign in as {string}")
    public void iSignInAs(String email) {
        Fixtures.User user = Fixtures.userByEmail(email);
        shop.ensureUser(user);

        catalog.awaitScreen();
        header.openLogin();
        login.awaitScreen();
        login.signIn(user.email(), user.password());

        context.currentUserEmail(user.email());
    }

    @When("I attempt to sign in as {string} with the wrong password")
    public void iAttemptToSignInWithTheWrongPassword(String email) {
        catalog.awaitScreen();
        header.openLogin();
        login.awaitScreen();
        login.signIn(email, Fixtures.wrongPassword());
    }

    @When("I sign out")
    public void iSignOut() {
        header.logout();
    }

    @Then("I am recognised as {string}")
    public void iAmRecognisedAs(String email) {
        catalog.awaitScreen();
        assertThat(header.isSignedIn()).as("logout affordance shown").isTrue();

        // Registration scenarios use a per-run unique address, so the literal in the
        // Gherkin is a placeholder for whichever account was actually created.
        String expected = context.registeredEmail() != null ? context.registeredEmail() : email;
        assertThat(header.currentUser()).isEqualToIgnoringCase(expected);
    }

    @Then("I am told the credentials are invalid")
    public void iAmToldTheCredentialsAreInvalid() {
        assertThat(login.hasError()).as("login error shown").isTrue();
    }

    @Then("I am no longer signed in")
    public void iAmNoLongerSignedIn() {
        assertThat(header.isSignedOut()).as("login affordance shown").isTrue();
    }
}
