package com.shop.order;

import com.shop.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Tag(name = "Checkout & Orders", description = "Order placement and history")
public class OrderController {

    private final OrderService orderService;
    private final AuthService authService;

    public OrderController(OrderService orderService, AuthService authService) {
        this.orderService = orderService;
        this.authService = authService;
    }

    @PostMapping("/api/checkout")
    @Operation(summary = "Pay for the current cart and place an order")
    public ResponseEntity<OrderDtos.OrderResponse> checkout(
            @Valid @RequestBody OrderDtos.CheckoutRequest request) {
        var order = orderService.checkout(authService.currentUser(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(OrderDtos.OrderResponse.from(order));
    }

    @GetMapping("/api/orders")
    @Operation(summary = "List the current user's orders, newest first")
    public List<OrderDtos.OrderResponse> history() {
        return orderService.history(authService.currentUser()).stream()
                .map(OrderDtos.OrderResponse::from)
                .toList();
    }

    @GetMapping("/api/orders/{orderNumber}")
    @Operation(summary = "Fetch a single order belonging to the current user")
    public OrderDtos.OrderResponse byNumber(@PathVariable String orderNumber) {
        return OrderDtos.OrderResponse.from(
                orderService.byOrderNumber(authService.currentUser(), orderNumber));
    }
}
