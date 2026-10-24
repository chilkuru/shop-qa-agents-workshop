package com.shop.order;

import com.shop.cart.Cart;
import com.shop.cart.CartService;
import com.shop.catalog.Product;
import com.shop.catalog.ProductRepository;
import com.shop.common.ApiExceptions;
import com.shop.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
public class OrderService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final OrderRepository orders;
    private final ProductRepository products;
    private final CartService cartService;
    private final MockPaymentGateway paymentGateway;

    public OrderService(OrderRepository orders,
                        ProductRepository products,
                        CartService cartService,
                        MockPaymentGateway paymentGateway) {
        this.orders = orders;
        this.products = products;
        this.cartService = cartService;
        this.paymentGateway = paymentGateway;
    }

    @Transactional
    public Order checkout(User user, OrderDtos.CheckoutRequest request) {
        Cart cart = cartService.cartFor(user);
        if (cart.getItems().isEmpty()) {
            throw new ApiExceptions.BadRequestException("Cannot check out with an empty cart");
        }

        int total = cart.totalPaise();
        var payment = paymentGateway.charge(request.card().number(), total);
        if (!payment.approved()) {
            throw new ApiExceptions.BadRequestException(payment.message());
        }

        Order order = Order.builder()
                .user(user)
                .orderNumber(generateOrderNumber())
                .status(Order.Status.CONFIRMED)
                .totalPaise(total)
                .shippingName(request.shippingName())
                .shippingAddress(request.shippingAddress())
                .build();

        cart.getItems().forEach(item -> {
            Product product = item.getProduct();
            product.setStock(product.getStock() - item.getQuantity());
            products.save(product);

            order.getItems().add(OrderItem.builder()
                    .order(order)
                    .productId(product.getId())
                    .productName(product.getName())
                    .unitPricePaise(product.getPricePaise())
                    .quantity(item.getQuantity())
                    .build());
        });

        Order saved = orders.save(order);
        cartService.clear(user);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Order> history(User user) {
        return orders.findByUserIdOrderByPlacedAtDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public Order byOrderNumber(User user, String orderNumber) {
        return orders.findByOrderNumberAndUserId(orderNumber, user.getId())
                .orElseThrow(() -> new ApiExceptions.NotFoundException("Order " + orderNumber + " not found"));
    }

    private String generateOrderNumber() {
        StringBuilder sb = new StringBuilder("ORD-");
        for (int i = 0; i < 8; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
