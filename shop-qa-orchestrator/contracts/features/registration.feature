# SHOP-5 — Registration
# Account creation. Separate from AUTH-02, which covers an existing account.

@AUTH-01 @P1 @testlink:SHOP-5
Feature: Creating an account
  As a new shopper
  I want to register
  So that I can place orders under my own account

  Background:
    Given the shop is available

  @api @web @mobile @smoke
  Scenario: Register a brand new account
    Given "newcomer@shop.in" has no account
    When I register as "newcomer@shop.in"
    Then I am recognised as "newcomer@shop.in"

  @api @web @mobile
  Scenario: Registering an email that is already taken is refused
    Given I am a registered shopper "demo@shop.in"
    When I attempt to register as "demo@shop.in"
    Then I am told the email is already registered

  @api
  Scenario: A new account starts with an empty cart
    Given "newcomer@shop.in" has no account
    When I register as "newcomer@shop.in"
    Then my cart is now empty
