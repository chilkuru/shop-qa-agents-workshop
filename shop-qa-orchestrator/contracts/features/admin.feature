# SHOP-12 — Catalog administration
# Proves role separation: the same endpoints refuse an ordinary shopper.

@ADMIN-01 @P2 @testlink:SHOP-12
Feature: Administering the catalog
  As an administrator
  I want to manage stock and visibility
  So that the catalog reflects what we can actually sell

  Background:
    Given the shop is available

  @api @web @mobile @smoke
  Scenario: An administrator sees every product
    Given I am signed in as "admin@shop.in"
    When I open the product administration list
    Then I see all 12 products including hidden ones

  # Not @mobile: the app hides the admin entry point from shoppers, so there is no
  # affordance to drive. Role separation is proven on @api and @web instead.
  @api @web
  Scenario: An ordinary shopper is refused
    Given I am signed in as "demo@shop.in"
    When I open the product administration list
    Then the request is refused as forbidden

  @api @web @mobile
  Scenario: An administrator can change stock
    Given I am signed in as "admin@shop.in"
    When I set the stock of "Mechanical Keyboard" to 3
    Then "Mechanical Keyboard" reports 3 in stock

  @api @web @mobile
  Scenario: Hiding a product removes it from the shopper catalog
    Given I am signed in as "admin@shop.in"
    When I hide "Wireless Mouse" from the catalog
    Then the shopper catalog holds 11 products
    And restoring "Wireless Mouse" brings the catalog back to 12
