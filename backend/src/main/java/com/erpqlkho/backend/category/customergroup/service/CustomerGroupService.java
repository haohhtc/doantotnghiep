package com.erpqlkho.backend.category.customergroup.service;

import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.repository.CustomerRepository;
import com.erpqlkho.backend.category.customergroup.dto.CustomerGroupDto;
import com.erpqlkho.backend.category.customergroup.dto.CustomerGroupMemberDto;
import com.erpqlkho.backend.category.customergroup.entity.CustomerGroup;
import com.erpqlkho.backend.category.customergroup.entity.CustomerGroupMember;
import com.erpqlkho.backend.category.customergroup.repository.CustomerGroupMemberRepository;
import com.erpqlkho.backend.category.customergroup.repository.CustomerGroupRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerGroupService {

    private final CustomerGroupRepository customerGroupRepository;
    private final CustomerGroupMemberRepository customerGroupMemberRepository;
    private final CustomerRepository customerRepository;

    public List<CustomerGroup> findAll() {
        return customerGroupRepository.findAll();
    }

    public CustomerGroup findById(Long id) {
        return customerGroupRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nhom khach hang id=" + id));
    }

    @Transactional
    public CustomerGroup create(CustomerGroupDto dto) {
        if (customerGroupRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhom khach hang da ton tai: " + dto.getCode());
        }
        CustomerGroup group = new CustomerGroup();
        group.setCode(dto.getCode());
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        return customerGroupRepository.save(group);
    }

    @Transactional
    public CustomerGroup update(Long id, CustomerGroupDto dto) {
        CustomerGroup group = findById(id);
        if (!group.getCode().equals(dto.getCode()) && customerGroupRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhom khach hang da ton tai: " + dto.getCode());
        }
        group.setCode(dto.getCode());
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        return customerGroupRepository.save(group);
    }

    @Transactional
    public void delete(Long id) {
        CustomerGroup group = findById(id);
        customerGroupMemberRepository.deleteAll(customerGroupMemberRepository.findByCustomerGroupId(id));
        customerGroupRepository.delete(group);
    }

    // --- Khach hang trong nhom (M:N) - xem V21__employee_route_customer_group_mn.sql ---

    public List<CustomerGroupMember> findMembers(Long groupId) {
        findById(groupId);
        return customerGroupMemberRepository.findByCustomerGroupId(groupId);
    }

    @Transactional
    public CustomerGroupMember addMember(Long groupId, CustomerGroupMemberDto dto) {
        CustomerGroup group = findById(groupId);
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> ApiException.notFound("Khong tim thay khach hang id=" + dto.getCustomerId()));

        if (customerGroupMemberRepository.existsByCustomerGroupIdAndCustomerId(groupId, dto.getCustomerId())) {
            throw ApiException.conflict("Khach hang nay da co trong nhom");
        }

        CustomerGroupMember member = new CustomerGroupMember();
        member.setCustomerGroup(group);
        member.setCustomer(customer);
        member.setCreatedAt(LocalDateTime.now());
        return customerGroupMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Long groupId, Long memberId) {
        CustomerGroupMember member = customerGroupMemberRepository.findById(memberId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay dong id=" + memberId));
        if (!member.getCustomerGroup().getId().equals(groupId)) {
            throw ApiException.notFound("Dong nay khong thuoc nhom khach hang id=" + groupId);
        }
        customerGroupMemberRepository.delete(member);
    }
}
