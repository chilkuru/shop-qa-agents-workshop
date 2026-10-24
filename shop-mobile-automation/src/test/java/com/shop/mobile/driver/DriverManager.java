package com.shop.mobile.driver;

import com.shop.mobile.config.Config;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.options.UiAutomator2Options;

import java.net.MalformedURLException;
import java.net.URI;
import java.time.Duration;

/**
 * One driver per thread so the suite can be parallelised later without sharing state.
 */
public final class DriverManager {

    private static final ThreadLocal<AndroidDriver> DRIVER = new ThreadLocal<>();

    private DriverManager() {
    }

    public static AndroidDriver get() {
        AndroidDriver driver = DRIVER.get();
        if (driver == null) {
            throw new IllegalStateException("No driver started for this thread");
        }
        return driver;
    }

    public static void start() {
        if (DRIVER.get() != null) {
            return;
        }
        Config config = Config.get();

        UiAutomator2Options options = new UiAutomator2Options()
                .setPlatformName("Android")
                .setAutomationName("UiAutomator2")
                .setDeviceName(config.deviceName())
                .setAppPackage(config.appPackage())
                .setAppActivity(config.appActivity())
                .setNewCommandTimeout(Duration.ofMinutes(3))
                .setAutoGrantPermissions(true);
        // Keeps the already-installed APK; the build pipeline owns installation.
        options.setCapability("appium:noReset", true);
        options.setCapability("appium:forceAppLaunch", true);

        try {
            DRIVER.set(new AndroidDriver(URI.create(config.appiumUrl()).toURL(), options));
        } catch (MalformedURLException | IllegalArgumentException e) {
            throw new IllegalStateException("Bad Appium URL: " + config.appiumUrl(), e);
        }
    }

    public static void stop() {
        AndroidDriver driver = DRIVER.get();
        if (driver != null) {
            driver.quit();
            DRIVER.remove();
        }
    }
}
