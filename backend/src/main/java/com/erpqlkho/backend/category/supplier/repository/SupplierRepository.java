package com.erpqlkho.backend.category.supplier.repository;

import com.erpqlkho.backend.category.supplier.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    boolean existsByCode(String code);
}
