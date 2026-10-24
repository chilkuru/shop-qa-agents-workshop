package com.shop.review;

import com.shop.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@Tag(name = "Reviews", description = "Product reviews from verified buyers")
public class ReviewController {

    private final ReviewService reviewService;
    private final AuthService authService;

    public ReviewController(ReviewService reviewService, AuthService authService) {
        this.reviewService = reviewService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "List reviews for a product")
    public ReviewDtos.ReviewListResponse list(@PathVariable Long productId) {
        List<Review> reviews = reviewService.forProduct(productId);

        // Anonymous callers simply cannot review; that is not an error.
        boolean canReview = authService.currentUserOrNull() != null
                && reviewService.hasPurchased(authService.currentUserOrNull(), productId);

        return new ReviewDtos.ReviewListResponse(
                productId,
                reviews.stream().map(ReviewDtos.ReviewResponse::from).toList(),
                reviews.size(),
                reviewService.averageRating(reviews),
                canReview);
    }

    @PostMapping
    @Operation(summary = "Submit or update your review; buyers only")
    public ReviewDtos.ReviewListResponse submit(@PathVariable Long productId,
                                                @Valid @RequestBody ReviewDtos.SubmitReviewRequest request) {
        reviewService.submit(authService.currentUser(), productId,
                request.rating(), request.comment() == null ? "" : request.comment());
        return list(productId);
    }
}
