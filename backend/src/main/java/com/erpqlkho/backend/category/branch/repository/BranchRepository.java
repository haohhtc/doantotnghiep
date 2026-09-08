package com.erpqlkho.backend.category.branch.repository;

import com.erpqlkho.backend.category.branch.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    boolean existsByCode(String code);
}
