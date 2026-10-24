# SHOP-11 — Reviews
# Only verified buyers may review, and each holds a single editable review.

@REVIEWS-01 @P2 @testlink:SHOP-11
Feature: Reviewing a product
  As a shopper who bought a product
  I want to leave a review
  So that other shoppers know what I thought

  Background:
    Given the shop is available
    And I am signed in as "demo@shop.in"
    And I have no order history

  @api @web @mobile @smoke
  Scenario: A buyer can review what they bought
    Given I have already placed an order for "Desk Lamp"
    When I review "Desk Lamp" with 5 stars
    Then "Desk Lamp" has 1 review
    And "Desk Lamp" has an average rating of 5

  @api @web @mobile
  Scenario: Reviewing again edits the existing review
    Given I have already placed an order for "Desk Lamp"
    And I have reviewed "Desk Lamp" with 5 stars
    When I review "Desk Lamp" with 3 stars
    Then "Desk Lamp" has 1 review
    And "Desk Lamp" has an average rating of 3

  @api
  Scenario: A shopper who never bought the product cannot review it
    When I review "Standing Desk" with 5 stars
    Then I am told only buyers can review

  @api @web @mobile
  Scenario: Reviews are readable without signing in
    Given I have already placed an order for "Desk Lamp"
    And I have reviewed "Desk Lamp" with 4 stars
    When anyone views the reviews for "Desk Lamp"
    Then "Desk Lamp" has 1 review
    And reviewing is not offered
