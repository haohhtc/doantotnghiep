package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.GoodsIssue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoodsIssueRepository extends JpaRepository<GoodsIssue, Long> {
    boolean existsByDocNumber(String docNumber);
}
