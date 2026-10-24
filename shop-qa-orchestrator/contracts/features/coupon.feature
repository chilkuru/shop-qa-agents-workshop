# SHOP-10 — Coupons
# Percentage discounts applied to the cart, with eligibility rules.

@COUPON-01 @P2 @testlink:SHOP-10
Feature: Applying a discount coupon
  As a signed-in shopper
  I want to apply a coupon to my cart
  So that I pay less

  Background:
    Given the shop is available
    And I am signed in as "demo@shop.in"
    And my cart contains 1 of "Espresso Machine"

  @api @web @mobile @smoke
  Scenario: A valid coupon reduces the total
    When I apply coupon "SAVE10"
    Then my cart shows a 10 percent discount
    And my cart total is the subtotal minus the discount

  @api @web @mobile
  Scenario: A coupon below its minimum order is refused
    When I apply coupon "SAVE25"
    Then I am told the coupon cannot be used

  @api @web @mobile
  Scenario: An inactive coupon is refused
    When I apply coupon "EXPIRED"
    Then I am told the coupon cannot be used

  @api @web @mobile
  Scenario: An unknown coupon is refused
    When I apply coupon "NOSUCHCODE"
    Then I am told the coupon cannot be used

  @api @web @mobile
  Scenario: A coupon can be removed
    Given I have applied coupon "SAVE10"
    When I remove the coupon
    Then my cart has no discount
