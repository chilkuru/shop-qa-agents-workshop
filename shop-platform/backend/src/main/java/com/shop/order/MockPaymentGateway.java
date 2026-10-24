package com.shop.order;

import org.springframework.stereotype.Component;

/**
 * Deterministic mock payment gateway. Behaviour is driven purely by the card number
 * so test fixtures can rely on it; no external service is contacted.
 */
@Component
public class MockPaymentGateway {

    public static final String CARD_SUCCESS = "4111111111111111";
    public static final String CARD_DECLINED = "4000000000000002";
    public static final String CARD_INSUFFICIENT_FUNDS = "4000000000009995";

    public record Result(boolean approved, String code, String message) {
    }

    public Result charge(String cardNumber, int amountPaise) {
        String digits = cardNumber == null ? "" : cardNumber.replaceAll("\\s|-", "");

        if (amountPaise <= 0) {
            return new Result(false, "INVALID_AMOUNT", "Order total must be greater than zero");
        }
        return switch (digits) {
            case CARD_DECLINED -> new Result(false, "CARD_DECLINED", "Your card was declined");
            case CARD_INSUFFICIENT_FUNDS -> new Result(false, "INSUFFICIENT_FUNDS", "Insufficient funds");
            case CARD_SUCCESS -> new Result(true, "APPROVED", "Payment approved");
            default -> new Result(false, "INVALID_CARD", "Card number is not recognised");
        };
    }
}
