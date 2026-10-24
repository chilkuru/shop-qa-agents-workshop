package com.shop.catalog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    // Params are normalised to "" rather than null: Postgres cannot infer the type of a
    // null bind parameter and falls back to bytea, breaking lower().
    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
              AND (:category = '' OR p.category = :category)
            """)
    Page<Product> search(@Param("search") String search,
                         @Param("category") String category,
                         Pageable pageable);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.active = true ORDER BY p.category")
    List<String> findDistinctCategories();
}
