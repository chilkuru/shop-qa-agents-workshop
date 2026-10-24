package com.shop.api.fixtures;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shop.api.config.Config;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/** Repository over the shared fixture files. Frameworks never hardcode test data. */
public final class Fixtures {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Map<String, JsonNode> CACHE = new HashMap<>();

    private Fixtures() {
    }

    private static JsonNode load(String name) {
        return CACHE.computeIfAbsent(name, key -> {
            Path path = Path.of(Config.get().contractsDir(), "fixtures", key + ".json");
            try {
                return MAPPER.readTree(Files.readString(path));
            } catch (IOException e) {
                throw new UncheckedIOException("Cannot read fixture " + path, e);
            }
        });
    }

    public static User user(String key) {
        JsonNode node = load("users").path("users").path(key);
        if (node.isMissingNode()) {
            throw new IllegalArgumentException("No fixture user '" + key + "'");
        }
        return new User(
                node.path("email").asText(),
                node.path("password").asText(),
                node.path("fullName").asText(),
                node.path("role").asText("CUSTOMER"));
    }

    /** Fixture users are keyed by short name but scenarios refer to them by email. */
    public static User userByEmail(String email) {
        JsonNode users = load("users").path("users");
        var names = users.fieldNames();
        while (names.hasNext()) {
            String key = names.next();
            if (users.path(key).path("email").asText().equalsIgnoreCase(email)) {
                return user(key);
            }
        }
        throw new IllegalArgumentException("No fixture user with email '" + email + "'");
    }

    public static String wrongPassword() {
        return load("users").path("wrongPassword").asText();
    }

    public static Card card(String key) {
        JsonNode node = load("cards").path("cards").path(key);
        if (node.isMissingNode()) {
            throw new IllegalArgumentException("No fixture card '" + key + "'");
        }
        return new Card(
                node.path("number").asText(),
                node.path("expiry").asText(),
                node.path("cvc").asText(),
                node.path("outcome").asText());
    }

    public static Shipping shipping() {
        JsonNode node = load("cards").path("shipping");
        return new Shipping(node.path("name").asText(), node.path("address").asText());
    }

    public static int catalogSize() {
        return load("products").path("catalogSize").asInt();
    }

    public static long pricePaise(String productName) {
        for (JsonNode product : load("products").path("products")) {
            if (product.path("name").asText().equalsIgnoreCase(productName)) {
                return product.path("pricePaise").asLong();
            }
        }
        throw new IllegalArgumentException("No fixture product '" + productName + "'");
    }

    public record User(String email, String password, String fullName, String role) {
    }

    public record Card(String number, String expiry, String cvc, String outcome) {
    }

    public record Shipping(String name, String address) {
    }
}
