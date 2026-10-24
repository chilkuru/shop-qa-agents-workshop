# SHOP-6 — Product detail
# Single-item view. Proves navigation from a list into a detail record.

@PRODUCT-01 @P2 @testlink:SHOP-6
Feature: Viewing a product
  As a shopper
  I want to see a product's full details
  So that I can decide whether to buy it

  Background:
    Given the shop is available
    And the catalog is seeded with the demo products

  @api @web @mobile @smoke
  Scenario: Open a product from the catalog
    When I open the product "Espresso Machine"
    Then I see the product details for "Espresso Machine"
    And the product shows the price of 1 "Espresso Machine"

  @api @web @mobile
  Scenario: A product shows its category and stock state
    When I open the product "4K Monitor"
    Then the product belongs to category "Peripherals"
    And the product is shown as in stock

  @api
  Scenario: Requesting a product that does not exist is refused
    When I request the product with id 999999
    Then the product is reported as not found
