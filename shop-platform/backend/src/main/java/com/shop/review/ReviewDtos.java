package com.shop.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public class ReviewDtos {

    public record SubmitReviewRequest(
            @NotNull @Min(1) @Max(5) Integer rating,
            String comment) {
    }

    public record ReviewResponse(
            Long id,
            Long productId,
            String author,
            Integer rating,
            String comment,
            Instant createdAt) {

        public static ReviewResponse from(Review review) {
            return new ReviewResponse(
                    review.getId(),
                    review.getProduct().getId(),
                    review.getUser().getFullName(),
                    review.getRating(),
                    review.getComment(),
                    review.getCreatedAt());
        }
    }

    public record ReviewListResponse(
            Long productId,
            List<ReviewResponse> reviews,
            Integer count,
            Double averageRating,
            Boolean canReview) {
    }
}
