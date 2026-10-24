# SHOP-1 — Authentication
# Session/token handling. Every other journey depends on this.

@AUTH-02 @P1 @testlink:SHOP-1
Feature: Account access
  As a shopper
  I want to sign in and out
  So that my cart and orders stay attached to me

  Background:
    Given the shop is available

  @api @web @mobile @slice @smoke
  Scenario: Sign in with valid credentials
    Given I am a registered shopper "demo@shop.in"
    When I sign in as "demo@shop.in"
    Then I am recognised as "demo@shop.in"

  @api @web @mobile @slice
  Scenario: Sign in is rejected with the wrong password
    Given I am a registered shopper "demo@shop.in"
    When I attempt to sign in as "demo@shop.in" with the wrong password
    Then I am told the credentials are invalid
    And I am no longer signed in

  @api @web @mobile @slice
  Scenario: Sign out ends the session
    Given I am signed in as "demo@shop.in"
    When I sign out
    Then I am no longer signed in

  @api @slice
  Scenario: A protected resource cannot be reached without signing in
    Given I am not signed in
    When I request my cart
    Then the request is refused as unauthorised
