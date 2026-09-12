package com.erpqlkho.backend.user.repository;

import com.erpqlkho.backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByRoleId(Long roleId);

    // Danh sach salesman cua 1 chi nhanh - xem BranchService.findSalesmen (GET /api/branches/{id}/salesmen).
    List<User> findByBranchIdAndRole_Code(Long branchId, String roleCode);
}
