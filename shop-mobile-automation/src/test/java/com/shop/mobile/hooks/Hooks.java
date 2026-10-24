package com.shop.mobile.hooks;

import com.shop.mobile.config.Config;
import com.shop.mobile.driver.DriverManager;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import io.qameta.allure.Allure;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

import java.io.ByteArrayInputStream;
import java.util.Map;

public class Hooks {

    @Before
    public void startApp() {
        DriverManager.start();

        // noReset keeps AsyncStorage, so a previous scenario's session would leak in and
        // the header would show "Log out" instead of "Log in". Clearing app data is the
        // cheapest way to guarantee every scenario starts signed out.
        String appId = Config.get().appPackage();
        DriverManager.get().executeScript("mobile: clearApp", Map.of("appId", appId));
        DriverManager.get().activateApp(appId);
    }

    @After
    public void attachFailureEvidence(Scenario scenario) {
        if (scenario.isFailed()) {
            try {
                byte[] screenshot = ((TakesScreenshot) DriverManager.get())
                        .getScreenshotAs(OutputType.BYTES);
                Allure.addAttachment("Screen", new ByteArrayInputStream(screenshot));
                scenario.attach(screenshot, "image/png", "screen");

                String source = DriverManager.get().getPageSource();
                Allure.addAttachment("Page source", "text/xml", source);

                String logcat = DriverManager.get().manage().logs().get("logcat").getAll().stream()
                        .skip(Math.max(0, DriverManager.get().manage().logs().get("logcat").getAll().size() - 80))
                        .map(Object::toString)
                        .reduce("", (a, b) -> a + b + System.lineSeparator());
                Allure.addAttachment("Logcat tail", "text/plain", logcat);
            } catch (Exception attachmentFailure) {
                Allure.addAttachment("Evidence capture failed", "text/plain",
                        attachmentFailure.toString());
            }
        }
        DriverManager.stop();
    }
}
