package com.erpqlkho.backend.category.customergroup.repository;

import com.erpqlkho.backend.category.customergroup.entity.CustomerGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerGroupMemberRepository extends JpaRepository<CustomerGroupMember, Long> {
    List<CustomerGroupMember> findByCustomerGroupId(Long customerGroupId);
    List<CustomerGroupMember> findByCustomerId(Long customerId);
    boolean existsByCustomerGroupIdAndCustomerId(Long customerGroupId, Long customerId);
}
