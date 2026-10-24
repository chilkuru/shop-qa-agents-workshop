package com.shop.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public class OrderDtos {

    public record CardRequest(
            @NotBlank String number,
            @NotBlank String expiry,
            @NotBlank String cvc) {
    }

    public record CheckoutRequest(
            @NotBlank String shippingName,
            @NotBlank String shippingAddress,
            @NotNull @Valid CardRequest card) {
    }

    public record OrderItemResponse(
            Long productId,
            String productName,
            Integer unitPricePaise,
            Integer quantity,
            Integer lineTotalPaise) {

        public static OrderItemResponse from(OrderItem i) {
            return new OrderItemResponse(
                    i.getProductId(), i.getProductName(), i.getUnitPricePaise(),
                    i.getQuantity(), i.getUnitPricePaise() * i.getQuantity());
        }
    }

    public record OrderResponse(
            String orderNumber,
            String status,
            Integer totalPaise,
            String shippingName,
            String shippingAddress,
            List<OrderItemResponse> items,
            Instant placedAt) {

        public static OrderResponse from(Order o) {
            return new OrderResponse(
                    o.getOrderNumber(), o.getStatus().name(), o.getTotalPaise(),
                    o.getShippingName(), o.getShippingAddress(),
                    o.getItems().stream().map(OrderItemResponse::from).toList(),
                    o.getPlacedAt());
        }
    }
}
