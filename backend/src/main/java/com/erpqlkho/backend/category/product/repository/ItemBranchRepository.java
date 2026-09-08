package com.erpqlkho.backend.category.product.repository;

import com.erpqlkho.backend.category.product.entity.ItemBranch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemBranchRepository extends JpaRepository<ItemBranch, Long> {
    List<ItemBranch> findByProductId(Long productId);
    List<ItemBranch> findByBranchId(Long branchId);
    boolean existsByProductIdAndBranchId(Long productId, Long branchId);
}
