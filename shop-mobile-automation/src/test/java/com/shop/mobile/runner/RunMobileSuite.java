package com.shop.mobile.runner;

import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectDirectories;
import org.junit.platform.suite.api.Suite;

/** Glue and plugins are configured in junit-platform.properties. */
@Suite
@IncludeEngines("cucumber")
@SelectDirectories("../shop-qa-orchestrator/contracts/features")
public class RunMobileSuite {
}
