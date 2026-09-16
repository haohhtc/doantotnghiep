package com.erpqlkho.backend.category.productgroup.repository;

import com.erpqlkho.backend.category.productgroup.entity.ProductGroupItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductGroupItemRepository extends JpaRepository<ProductGroupItem, Long> {
    List<ProductGroupItem> findByProductGroupId(Long productGroupId);
    boolean existsByProductGroupIdAndProductId(Long productGroupId, Long productId);
}
