package com.shop.mobile.config;

public final class Config {

    private static final Config INSTANCE = new Config();

    private final String appiumUrl;
    private final String apiBaseUrl;
    private final String testSupportToken;
    private final String contractsDir;
    private final String appPackage;
    private final String appActivity;
    private final String deviceName;

    private Config() {
        this.appiumUrl = resolve("APPIUM_URL", "appium.url", "http://127.0.0.1:4723");
        this.apiBaseUrl = resolve("SHOP_API_BASE_URL", "shop.api.baseUrl", "http://localhost:8081");
        this.testSupportToken = resolve("TEST_SUPPORT_TOKEN", "shop.testSupport.token", "local-test-token");
        this.contractsDir = resolve("CONTRACTS_DIR", "contracts.dir", "../shop-qa-orchestrator/contracts");
        this.appPackage = resolve("APP_PACKAGE", "app.package", "com.shop.mobile");
        this.appActivity = resolve("APP_ACTIVITY", "app.activity", ".MainActivity");
        this.deviceName = resolve("DEVICE_NAME", "device.name", "emulator-5554");
    }

    public static Config get() {
        return INSTANCE;
    }

    public String appiumUrl() {
        return appiumUrl;
    }

    public String apiBaseUrl() {
        return apiBaseUrl;
    }

    public String testSupportToken() {
        return testSupportToken;
    }

    public String contractsDir() {
        return contractsDir;
    }

    public String appPackage() {
        return appPackage;
    }

    public String appActivity() {
        return appActivity;
    }

    public String deviceName() {
        return deviceName;
    }

    private static String resolve(String envVar, String systemProperty, String fallback) {
        String fromEnv = System.getenv(envVar);
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv;
        }
        return System.getProperty(systemProperty, fallback);
    }
}
