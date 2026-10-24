# SHOP-2 — Catalog
# List rendering and repeated elements. Stress-tests the locator strategy.

@CATALOG-01 @P1 @testlink:SHOP-2
Feature: Browsing the catalog
  As a shopper
  I want to browse, search and filter products
  So that I can find what I want to buy

  Background:
    Given the shop is available
    And the catalog is seeded with the demo products

  @api @web @mobile @slice @smoke
  Scenario: Browse every product
    When I open the catalog
    Then I see 12 products

  @api @web @mobile @slice
  Scenario: Search narrows the catalog by name
    When I search the catalog for "espresso"
    Then I see 1 product
    And the results include "Espresso Machine"

  @api @web @mobile @slice
  Scenario Outline: Filter the catalog by category
    When I filter the catalog by category "<category>"
    Then every result belongs to category "<category>"

    Examples:
      | category    |
      | Audio       |
      | Furniture   |
      | Kitchen     |
      | Peripherals |

  @api @web @mobile @slice
  Scenario: Clearing the filters restores the full catalog
    Given I have searched the catalog for "espresso"
    When I clear the catalog filters
    Then I see 12 products

  @api @web @mobile @slice
  Scenario: A search with no matches reports an empty catalog
    When I search the catalog for "xyzzy"
    Then I see 0 products
    And I am told no products matched
