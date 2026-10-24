# SHOP-3 — Cart
# State mutation: seeding AND asserting on changed state.
# NOTE: the @mobile scenarios below are a RESERVED COVERAGE GAP — tagged on purpose,
# deliberately not implemented, so find_gaps surfaces them as work.

@CART-01 @P1 @testlink:SHOP-3
Feature: Managing the cart
  As a signed-in shopper
  I want to add, adjust and remove items
  So that I buy exactly what I intend to

  Background:
    Given the shop is available
    And I am signed in as "demo@shop.in"
    And my cart is empty

  @api @web @mobile @slice @smoke
  Scenario: Add a product to the cart
    When I add "Espresso Machine" to my cart
    Then my cart contains 1 line
    And my cart shows 1 of "Espresso Machine"

  @api @web @mobile @slice
  Scenario: Increase the quantity of a cart line
    Given my cart contains 1 of "Espresso Machine"
    When I change the quantity of "Espresso Machine" to 3
    Then my cart shows 3 of "Espresso Machine"
    And my cart total is the price of 3 "Espresso Machine"

  @api @web @mobile @slice
  Scenario: Remove a product from the cart
    Given my cart contains 1 of "Espresso Machine"
    When I remove "Espresso Machine" from my cart
    Then my cart is now empty

  @api @web @mobile @slice
  Scenario: Adding the same product twice merges into one line
    Given my cart contains 1 of "Espresso Machine"
    When I add "Espresso Machine" to my cart
    Then my cart contains 1 line
    And my cart shows 2 of "Espresso Machine"

  @api @slice
  Scenario: Reducing a quantity to zero removes the line
    Given my cart contains 1 of "Espresso Machine"
    When I change the quantity of "Espresso Machine" to 0
    Then my cart is now empty
