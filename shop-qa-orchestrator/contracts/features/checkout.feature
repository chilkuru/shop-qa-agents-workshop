# SHOP-4 — Checkout
# Multi-step flow. Proves the Facade + API-seeding pattern.
# NOTE: the @web and @mobile scenarios below are RESERVED COVERAGE GAPS — tagged on
# purpose, deliberately not implemented.
# RESERVE "Pay with an approved card" @web TO FILL LIVE ON STAGE.

@CHECKOUT-01 @P1 @testlink:SHOP-4
Feature: Checking out
  As a signed-in shopper with a cart
  I want to pay and receive confirmation
  So that I know my order was placed

  Background:
    Given the shop is available
    And I am signed in as "demo@shop.in"
    And my cart contains 1 of "Espresso Machine"

  @api @web @mobile @slice @smoke
  Scenario: Pay with an approved card
    When I check out with the approved card
    Then my order is confirmed
    And I am given an order number
    And my cart is now empty

  @api @web @mobile @slice
  Scenario: A declined card does not place an order
    When I check out with the declined card
    Then the payment is declined
    And no order is placed
    And my cart shows 1 of "Espresso Machine"

  @api @slice
  Scenario: A card with insufficient funds does not place an order
    When I check out with the insufficient-funds card
    Then the payment is declined
    And no order is placed

  @api @slice
  Scenario: Checking out an empty cart is refused
    Given my cart is empty
    When I check out with the approved card
    Then I am told the cart is empty
    And no order is placed
