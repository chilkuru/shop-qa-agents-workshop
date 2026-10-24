package com.shop.mobile.steps;

import com.shop.mobile.context.ScenarioContext;
import com.shop.mobile.screens.AddressesScreen;
import com.shop.mobile.support.ShopApi;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

public class AddressSteps {

    private static final Map<String, Map<String, String>> ADDRESSES = Map.of(
            "Home", ordered("Home", "42 MG Road", "560001"),
            "Office", ordered("Office", "9 Residency Road", "560025"));

    private final ShopApi shop;
    private final AddressesScreen addresses;
    private final ScenarioContext context;

    public AddressSteps(ShopApi shop, AddressesScreen addresses, ScenarioContext context) {
        this.shop = shop;
        this.addresses = addresses;
        this.context = context;
    }

    /** LinkedHashMap so the form is filled top-to-bottom, matching the rendered order. */
    private static Map<String, String> ordered(String label, String line1, String postalCode) {
        Map<String, String> address = new LinkedHashMap<>();
        address.put("label", label);
        address.put("recipient", "Demo Shopper");
        address.put("line1", line1);
        address.put("city", "Bengaluru");
        address.put("state", "Karnataka");
        address.put("postalCode", postalCode);
        return address;
    }

    @Given("I have no saved addresses")
    public void iHaveNoSavedAddresses() {
        shop.clearAddresses(context.currentUserEmail());
    }

    @Given("I have saved my {string} address")
    public void iHaveSavedMyAddress(String label) {
        shop.saveAddress(context.currentUserEmail(), ADDRESSES.get(label));
    }

    @When("I save my {string} address")
    public void iSaveMyAddress(String label) {
        addresses.open();
        addresses.save(ADDRESSES.get(label));
    }

    @When("I make {string} my default address")
    public void iMakeMyDefaultAddress(String label) {
        addresses.open();
        addresses.makeDefault(label);
    }

    @When("I delete my {string} address")
    public void iDeleteMyAddress(String label) {
        addresses.open();
        addresses.delete(label);
    }

    @Then("I have {int} saved address")
    public void iHaveSavedAddress(int expected) {
        addresses.open();
        assertThat(addresses.reportedCount()).isEqualTo(expected);
    }

    @Then("I have {int} saved addresses")
    public void iHaveSavedAddresses(int expected) {
        addresses.open();
        assertThat(addresses.reportedCount()).isEqualTo(expected);
    }

    @Then("{string} is my default address")
    public void isMyDefaultAddress(String label) {
        assertThat(addresses.isDefault(label)).as("%s is default", label).isTrue();
    }

    @Then("exactly one address is marked default")
    public void exactlyOneAddressIsMarkedDefault() {
        assertThat(addresses.defaultCount()).isEqualTo(1);
    }
}
