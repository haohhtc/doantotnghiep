package com.erpqlkho.backend.category.employee.repository;

import com.erpqlkho.backend.category.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByCode(String code);
    List<Employee> findByType(String type);

    // App Van-Sale (di dong): nhan vien dang dang nhap tu suy ra qua user.username - xem
    // EmployeeService.findByCurrentUser().
    Optional<Employee> findByUser_Username(String username);
}
