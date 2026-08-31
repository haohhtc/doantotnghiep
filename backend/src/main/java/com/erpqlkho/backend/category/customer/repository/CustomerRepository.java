package com.erpqlkho.backend.category.customer.repository;

import com.erpqlkho.backend.category.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByCode(String code);
}
