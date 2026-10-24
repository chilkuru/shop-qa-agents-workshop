package com.shop.api.config;

/**
 * Single place that resolves configuration. Every value is overridable by an
 * environment variable so the same jar runs on a laptop and in CI unchanged.
 */
public final class Config {

    private static final Config INSTANCE = new Config();

    private final String baseUrl;
    private final String testSupportToken;
    private final String contractsDir;

    private Config() {
        this.baseUrl = resolve("SHOP_API_BASE_URL", "shop.api.baseUrl", "http://localhost:8081");
        this.testSupportToken = resolve("TEST_SUPPORT_TOKEN", "shop.testSupport.token", "local-test-token");
        this.contractsDir = resolve("CONTRACTS_DIR", "contracts.dir", "../shop-qa-orchestrator/contracts");
    }

    public static Config get() {
        return INSTANCE;
    }

    public String baseUrl() {
        return baseUrl;
    }

    public String testSupportToken() {
        return testSupportToken;
    }

    public String contractsDir() {
        return contractsDir;
    }

    private static String resolve(String envVar, String systemProperty, String fallback) {
        String fromEnv = System.getenv(envVar);
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv;
        }
        return System.getProperty(systemProperty, fallback);
    }
}
