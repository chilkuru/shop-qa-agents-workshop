# SHOP-8 — Wishlist
# Saving products for later. Scoped per shopper.

@WISHLIST-01 @P2 @testlink:SHOP-8
Feature: Saving products for later
  As a signed-in shopper
  I want to save products to a wishlist
  So that I can find them again without searching

  Background:
    Given the shop is available
    And I am signed in as "demo@shop.in"
    And my wishlist is empty

  @api @web @mobile @smoke
  Scenario: Save a product for later
    When I save "Espresso Machine" for later
    Then my wishlist holds 1 product
    And my wishlist includes "Espresso Machine"

  @api @web @mobile
  Scenario: Saving the same product twice keeps one entry
    Given I have saved "Espresso Machine" for later
    When I save "Espresso Machine" for later
    Then my wishlist holds 1 product

  @api @web @mobile
  Scenario: Remove a saved product
    Given I have saved "Espresso Machine" for later
    When I remove "Espresso Machine" from my wishlist
    Then my wishlist is now empty

  @api
  Scenario: Removing a product that was never saved is refused
    When I remove "Desk Lamp" from my wishlist
    Then I am told the product was not saved
