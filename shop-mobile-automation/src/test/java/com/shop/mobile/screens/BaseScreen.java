package com.shop.mobile.screens;

import com.shop.mobile.driver.DriverManager;
import io.appium.java_client.AppiumBy;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

/**
 * React Native writes `testID` to the RAW Android resource-id, so AppiumBy.id() is wrong:
 * it prefixes the app package. UiSelector.resourceId is native and faster than XPath.
 */
public abstract class BaseScreen {

    protected static final Duration TIMEOUT = Duration.ofSeconds(20);

    public static By byTestId(String testId) {
        return AppiumBy.androidUIAutomator(
                "new UiSelector().resourceId(\"" + testId + "\")");
    }

    protected static By byTestIdStartsWith(String prefix) {
        return AppiumBy.androidUIAutomator(
                "new UiSelector().resourceIdMatches(\"" + prefix + ".*\")");
    }

    protected WebDriverWait waiter() {
        return new WebDriverWait(DriverManager.get(), TIMEOUT);
    }

    protected WebElement visible(String testId) {
        return waiter().until(ExpectedConditions.visibilityOfElementLocated(byTestId(testId)));
    }

    protected WebElement clickable(String testId) {
        return waiter().until(ExpectedConditions.elementToBeClickable(byTestId(testId)));
    }

    protected List<WebElement> all(By locator) {
        return DriverManager.get().findElements(locator);
    }

    protected boolean isPresent(String testId) {
        return !DriverManager.get().findElements(byTestId(testId)).isEmpty();
    }

    /** Waits for the element to appear; false if it never does, without throwing. */
    protected boolean appears(String testId) {
        try {
            visible(testId);
            return true;
        } catch (org.openqa.selenium.TimeoutException notShown) {
            return false;
        }
    }

    /** Waits until at least one element matches, so callers never read a mid-render list. */
    protected List<WebElement> allSettled(By locator) {
        return waiter().until(ExpectedConditions.presenceOfAllElementsLocatedBy(locator));
    }

    protected void tap(String testId) {
        clickable(testId).click();
    }

    protected String textOf(String testId) {
        return visible(testId).getText();
    }

    protected void waitUntilGone(String testId) {
        try {
            waiter().until(ExpectedConditions.invisibilityOfElementLocated(byTestId(testId)));
        } catch (NoSuchElementException ignored) {
            // Already gone.
        }
    }

    /**
     * Virtualised lists only mount what is on screen. UiScrollable scrolls until the text
     * is rendered and returns that element, so callers can read its testID-derived id.
     */
    protected WebElement scrollIntoViewByText(String text) {
        return DriverManager.get().findElement(AppiumBy.androidUIAutomator(
                "new UiScrollable(new UiSelector().scrollable(true))"
                        + ".scrollIntoView(new UiSelector().text(\"" + text + "\"))"));
    }

    /** Same idea for elements with no text of their own, such as inputs and buttons. */
    protected WebElement scrollIntoView(String testId) {
        return DriverManager.get().findElement(AppiumBy.androidUIAutomator(
                "new UiScrollable(new UiSelector().scrollable(true))"
                        + ".scrollIntoView(new UiSelector().resourceId(\"" + testId + "\"))"));
    }

    /** BACK would pop the navigation stack, so the IME is dismissed explicitly. */
    protected void hideKeyboard() {
        try {
            DriverManager.get().hideKeyboard();
        } catch (org.openqa.selenium.WebDriverException notShown) {
            // No keyboard was up.
        }
    }
}
