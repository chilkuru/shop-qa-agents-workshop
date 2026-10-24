# SHOP-9 — Delivery addresses
# Exactly one default must always exist while the shopper has any address.

@ADDRESS-01 @P2 @testlink:SHOP-9
Feature: Managing delivery addresses
  As a signed-in shopper
  I want to save delivery addresses
  So that I do not retype them at checkout

  Background:
    Given the shop is available
    And I am signed in as "demo@shop.in"
    And I have no saved addresses

  @api @web @mobile @smoke
  Scenario: The first saved address becomes the default
    When I save my "Home" address
    Then I have 1 saved address
    And "Home" is my default address

  @api @web @mobile
  Scenario: A second address does not displace the default
    Given I have saved my "Home" address
    When I save my "Office" address
    Then I have 2 saved addresses
    And "Home" is my default address

  @api @web @mobile
  Scenario: The default can be switched
    Given I have saved my "Home" address
    And I have saved my "Office" address
    When I make "Office" my default address
    Then "Office" is my default address
    And exactly one address is marked default

  @api @web @mobile
  Scenario: Deleting the default promotes another address
    Given I have saved my "Home" address
    And I have saved my "Office" address
    When I delete my "Home" address
    Then I have 1 saved address
    And exactly one address is marked default
