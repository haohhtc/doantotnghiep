package com.erpqlkho.backend.category.employee.repository;

import com.erpqlkho.backend.category.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByCode(String code);
    List<Employee> findByType(String type);
}
