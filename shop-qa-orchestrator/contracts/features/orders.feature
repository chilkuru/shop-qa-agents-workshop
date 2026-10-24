# SHOP-7 — Order history
# Proves orders persist and are scoped to the account that placed them.

@ORDERS-01 @P1 @testlink:SHOP-7
Feature: Reviewing past orders
  As a signed-in shopper
  I want to see the orders I have placed
  So that I can check what I bought

  Background:
    Given the shop is available
    And I am signed in as "demo@shop.in"

  @api @web @mobile @smoke
  Scenario: A placed order appears in my history
    Given I have already placed an order for "Espresso Machine"
    When I open my order history
    Then my most recent order is listed as confirmed

  @api @web @mobile
  Scenario: Order history is empty for a shopper who has never bought anything
    Given I am signed in as "priya@shop.in"
    And I have no order history
    When I open my order history
    Then I am told I have no orders

  @api
  Scenario: One shopper cannot see another shopper's order
    Given "priya@shop.in" has placed an order
    When I open my order history
    Then that order is not listed
