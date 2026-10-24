package com.shop.api.runner;

import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectDirectories;
import org.junit.platform.suite.api.Suite;

/**
 * Feature files come from the shared contract repo, so this module owns no copy of the
 * Gherkin. Glue and plugins are configured in junit-platform.properties.
 */
@Suite
@IncludeEngines("cucumber")
@SelectDirectories("../shop-qa-orchestrator/contracts/features")
public class RunApiSuite {
}
