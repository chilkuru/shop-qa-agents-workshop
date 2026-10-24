package com.shop.api.hooks;

import com.shop.api.context.ScenarioContext;
import com.shop.api.support.ShopApi;
import io.cucumber.java.After;
import io.cucumber.java.BeforeAll;
import io.cucumber.java.Scenario;
import io.qameta.allure.Allure;

/**
 * Attaches failure evidence. Step definitions never call the reporter directly.
 */
public class Hooks {

    private final ScenarioContext context;

    public Hooks(ScenarioContext context) {
        this.context = context;
    }

    /**
     * Checkout permanently consumes stock, so without a top-up the suite stops being
     * repeatable once earlier runs have drained the catalog.
     */
    @BeforeAll
    public static void replenishCatalog() {
        new ShopApi().replenishStock(50);
    }

    @After
    public void attachFailureEvidence(Scenario scenario) {
        if (!scenario.isFailed()) {
            return;
        }
        try {
            var response = context.lastResponse();
            String dump = """
                    status: %d
                    time:   %d ms
                    headers:
                    %s
                    body:
                    %s
                    """.formatted(
                    response.statusCode(),
                    response.timeIn(java.util.concurrent.TimeUnit.MILLISECONDS),
                    response.headers().asList().stream()
                            .map(h -> "  " + h.getName() + ": " + h.getValue())
                            .reduce("", (a, b) -> a + b + System.lineSeparator()),
                    response.asPrettyString());

            Allure.addAttachment("Last HTTP response", "text/plain", dump);
            scenario.attach(dump.getBytes(), "text/plain", "last-response");
        } catch (IllegalStateException noRequestMade) {
            Allure.addAttachment("Last HTTP response", "text/plain",
                    "No HTTP request was made before the failure.");
        }
    }
}
