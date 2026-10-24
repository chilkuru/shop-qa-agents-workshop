package com.shop.wishlist;

import com.shop.catalog.Product;
import com.shop.catalog.ProductRepository;
import com.shop.common.ApiExceptions;
import com.shop.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WishlistService {

    private final WishlistRepository wishlist;
    private final ProductRepository products;

    public WishlistService(WishlistRepository wishlist, ProductRepository products) {
        this.wishlist = wishlist;
        this.products = products;
    }

    @Transactional(readOnly = true)
    public List<WishlistItem> list(User user) {
        return wishlist.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    /** Adding a product already saved is a no-op rather than an error. */
    @Transactional
    public WishlistItem add(User user, Long productId) {
        return wishlist.findByUserIdAndProductId(user.getId(), productId)
                .orElseGet(() -> {
                    Product product = products.findById(productId)
                            .orElseThrow(() -> new ApiExceptions.NotFoundException("No product " + productId));
                    return wishlist.save(WishlistItem.builder().user(user).product(product).build());
                });
    }

    @Transactional
    public void remove(User user, Long productId) {
        WishlistItem item = wishlist.findByUserIdAndProductId(user.getId(), productId)
                .orElseThrow(() -> new ApiExceptions.NotFoundException(
                        "Product " + productId + " is not in the wishlist"));
        wishlist.delete(item);
    }

    @Transactional
    public void clear(User user) {
        wishlist.deleteByUserId(user.getId());
    }
}
