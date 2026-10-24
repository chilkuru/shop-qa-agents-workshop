package com.shop.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByPlacedAtDesc(Long userId);

    Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);

    void deleteByUserId(Long userId);
}
