package com.shop.mobile.screens;

import io.qameta.allure.Step;
import org.openqa.selenium.WebElement;

import java.util.List;
import java.util.Map;

public class AddressesScreen extends BaseScreen {

    public void awaitScreen() {
        visible("addresses-screen");
        waitUntilGone("addresses-loading");
    }

    @Step("Open saved addresses")
    public void open() {
        if (isPresent("addresses-screen")) {
            awaitScreen();
            return;
        }
        tap("nav-addresses");
        awaitScreen();
    }

    public int reportedCount() {
        return Integer.parseInt(textOf("addresses-count").replaceAll("\\D+", ""));
    }

    @Step("Fill and save the delivery address form")
    public void save(Map<String, String> address) {
        for (Map.Entry<String, String> field : address.entrySet()) {
            WebElement input = visible("address-" + field.getKey() + "-input");
            input.clear();
            input.sendKeys(field.getValue());
        }
        hideKeyboard();
        tap("address-save-button");
    }

    @Step("Make {label} the default address")
    public void makeDefault(String label) {
        tap("address-make-default-" + addressIdFor(label));
    }

    @Step("Delete the {label} address")
    public void delete(String label) {
        tap("address-delete-" + addressIdFor(label));
    }

    public boolean isDefault(String label) {
        return isPresent("address-default-" + addressIdFor(label));
    }

    public int defaultCount() {
        return all(byTestIdStartsWith("address-default-")).size();
    }

    private List<WebElement> visibleLabels() {
        return allSettled(byTestIdStartsWith("address-label-"));
    }

    private int addressIdFor(String label) {
        for (WebElement element : visibleLabels()) {
            if (label.equalsIgnoreCase(element.getText())) {
                String resourceId = element.getAttribute("resource-id");
                return Integer.parseInt(resourceId.substring(resourceId.lastIndexOf('-') + 1));
            }
        }
        throw new IllegalArgumentException("No address row labelled '" + label + "'");
    }
}
