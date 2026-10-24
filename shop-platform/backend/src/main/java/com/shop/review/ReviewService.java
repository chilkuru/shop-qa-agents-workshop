package com.shop.review;

import com.shop.catalog.Product;
import com.shop.catalog.ProductRepository;
import com.shop.common.ApiExceptions;
import com.shop.order.OrderRepository;
import com.shop.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviews;
    private final ProductRepository products;
    private final OrderRepository orders;

    public ReviewService(ReviewRepository reviews, ProductRepository products, OrderRepository orders) {
        this.reviews = reviews;
        this.products = products;
        this.orders = orders;
    }

    @Transactional(readOnly = true)
    public List<Review> forProduct(Long productId) {
        return reviews.findByProductIdOrderByCreatedAtDesc(productId);
    }

    /**
     * Only shoppers who bought the product may review it, and each may hold one review;
     * submitting again edits the existing one.
     */
    @Transactional
    public Review submit(User user, Long productId, int rating, String comment) {
        Product product = products.findById(productId)
                .orElseThrow(() -> new ApiExceptions.NotFoundException("No product " + productId));

        if (!hasPurchased(user, productId)) {
            throw new ApiExceptions.BadRequestException(
                    "Only shoppers who have bought this product can review it");
        }

        return reviews.findByProductIdAndUserId(productId, user.getId())
                .map(existing -> {
                    existing.setRating(rating);
                    existing.setComment(comment);
                    return reviews.save(existing);
                })
                .orElseGet(() -> reviews.save(Review.builder()
                        .product(product)
                        .user(user)
                        .rating(rating)
                        .comment(comment)
                        .build()));
    }

    @Transactional(readOnly = true)
    public boolean hasPurchased(User user, Long productId) {
        return orders.findByUserIdOrderByPlacedAtDesc(user.getId()).stream()
                .flatMap(order -> order.getItems().stream())
                .anyMatch(item -> productId.equals(item.getProductId()));
    }

    public double averageRating(List<Review> forProduct) {
        return forProduct.stream().mapToInt(Review::getRating).average().orElse(0.0);
    }
}
