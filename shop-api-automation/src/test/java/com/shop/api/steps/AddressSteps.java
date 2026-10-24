package com.shop.api.steps;

import com.shop.api.context.ScenarioContext;
import com.shop.api.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

public class AddressSteps {

    private static final Map<String, Map<String, String>> ADDRESSES = Map.of(
            "Home", Map.of(
                    "label", "Home", "recipient", "Demo Shopper", "line1", "42 MG Road",
                    "city", "Bengaluru", "state", "Karnataka", "postalCode", "560001"),
            "Office", Map.of(
                    "label", "Office", "recipient", "Demo Shopper", "line1", "9 Residency Road",
                    "city", "Bengaluru", "state", "Karnataka", "postalCode", "560025"));

    private final ShopApi shop;
    private final ScenarioContext context;

    public AddressSteps(ShopApi shop, ScenarioContext context) {
        this.shop = shop;
        this.context = context;
    }

    @Given("I have no saved addresses")
    public void iHaveNoSavedAddresses() {
        for (Integer id : addressIds()) {
            shop.address().delete(context.token(), id);
        }
    }

    @Given("I have saved my {string} address")
    public void iHaveSavedMyAddress(String label) {
        shop.address().save(context.token(), ADDRESSES.get(label)).then().statusCode(200);
    }

    @When("I save my {string} address")
    public void iSaveMyAddress(String label) {
        context.lastResponse(shop.address().save(context.token(), ADDRESSES.get(label)));
    }

    @When("I make {string} my default address")
    public void iMakeMyDefaultAddress(String label) {
        context.lastResponse(shop.address().makeDefault(context.token(), idOf(label)));
    }

    @When("I delete my {string} address")
    public void iDeleteMyAddress(String label) {
        context.lastResponse(shop.address().delete(context.token(), idOf(label)));
    }

    @Then("I have {int} saved address")
    public void iHaveNSavedAddress(int expected) {
        assertThat(addressIds()).hasSize(expected);
    }

    @Then("I have {int} saved addresses")
    public void iHaveNSavedAddresses(int expected) {
        iHaveNSavedAddress(expected);
    }

    @Then("{string} is my default address")
    public void isMyDefaultAddress(String label) {
        assertThat(defaultLabel()).isEqualTo(label);
    }

    @Then("exactly one address is marked default")
    public void exactlyOneAddressIsMarkedDefault() {
        List<Boolean> flags = current().jsonPath().getList("addresses.isDefault", Boolean.class);
        assertThat(flags.stream().filter(Boolean::booleanValue).count()).isEqualTo(1);
    }

    private io.restassured.response.Response current() {
        return shop.address().list(context.token());
    }

    private List<Integer> addressIds() {
        return current().jsonPath().getList("addresses.id", Integer.class);
    }

    private long idOf(String label) {
        return current().jsonPath()
                .getLong("addresses.find { it.label == '" + label + "' }.id");
    }

    private String defaultLabel() {
        return current().jsonPath().getString("addresses.find { it.isDefault == true }.label");
    }
}
