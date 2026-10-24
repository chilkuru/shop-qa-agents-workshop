package com.shop.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** All values are supplied by environment variables; see application.yml. */
@ConfigurationProperties(prefix = "shop")
public record ShopProperties(Auth auth, Cors cors, TestSupport testSupport) {

    public record Auth(String jwtSecret, long jwtTtlMinutes) {
    }

    public record Cors(String allowedOrigins) {
        public String[] originsArray() {
            return allowedOrigins == null || allowedOrigins.isBlank()
                    ? new String[0]
                    : allowedOrigins.split("\\s*,\\s*");
        }
    }

    public record TestSupport(String token) {
    }
}
