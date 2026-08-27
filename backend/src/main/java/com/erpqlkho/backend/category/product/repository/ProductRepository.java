package com.erpqlkho.backend.category.product.repository;

import com.erpqlkho.backend.category.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByCode(String code);

    boolean existsByCategoryId(Long categoryId);
}
