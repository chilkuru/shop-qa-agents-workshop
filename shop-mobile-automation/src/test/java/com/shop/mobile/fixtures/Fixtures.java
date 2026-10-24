package com.shop.mobile.fixtures;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shop.mobile.config.Config;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/** Repository over the shared fixture files. */
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

    public static User userByEmail(String email) {
        JsonNode users = load("users").path("users");
        var names = users.fieldNames();
        while (names.hasNext()) {
            String key = names.next();
            JsonNode node = users.path(key);
            if (node.path("email").asText().equalsIgnoreCase(email)) {
                return new User(
                        node.path("email").asText(),
                        node.path("password").asText(),
                        node.path("fullName").asText(),
                        node.path("role").asText("CUSTOMER"));
            }
        }
        throw new IllegalArgumentException("No fixture user with email '" + email + "'");
    }

    public static String wrongPassword() {
        return load("users").path("wrongPassword").asText();
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
}
