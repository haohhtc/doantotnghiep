package com.erpqlkho.backend.category.customergroup.controller;

import com.erpqlkho.backend.category.customergroup.dto.CustomerGroupDto;
import com.erpqlkho.backend.category.customergroup.dto.CustomerGroupMemberDto;
import com.erpqlkho.backend.category.customergroup.entity.CustomerGroup;
import com.erpqlkho.backend.category.customergroup.entity.CustomerGroupMember;
import com.erpqlkho.backend.category.customergroup.service.CustomerGroupService;
import com.erpqlkho.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customer-groups")
@RequiredArgsConstructor
public class CustomerGroupController {

    private final CustomerGroupService customerGroupService;

    @GetMapping
    public ApiResponse<List<CustomerGroup>> findAll() {
        return ApiResponse.ok(customerGroupService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<CustomerGroup> findById(@PathVariable Long id) {
        return ApiResponse.ok(customerGroupService.findById(id));
    }

    @PostMapping
    public ApiResponse<CustomerGroup> create(@Valid @RequestBody CustomerGroupDto dto) {
        return ApiResponse.ok("Tao nhom khach hang thanh cong", customerGroupService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<CustomerGroup> update(@PathVariable Long id, @Valid @RequestBody CustomerGroupDto dto) {
        return ApiResponse.ok("Cap nhat nhom khach hang thanh cong", customerGroupService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        customerGroupService.delete(id);
        return ApiResponse.ok("Da xoa nhom khach hang", null);
    }

    // Khach hang trong nhom (M:N) - xem V21__employee_route_customer_group_mn.sql.
    @GetMapping("/{id}/members")
    public ApiResponse<List<CustomerGroupMember>> findMembers(@PathVariable Long id) {
        return ApiResponse.ok(customerGroupService.findMembers(id));
    }

    @PostMapping("/{id}/members")
    public ApiResponse<CustomerGroupMember> addMember(@PathVariable Long id, @Valid @RequestBody CustomerGroupMemberDto dto) {
        return ApiResponse.ok("Da them khach hang vao nhom", customerGroupService.addMember(id, dto));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ApiResponse<Void> removeMember(@PathVariable Long id, @PathVariable Long memberId) {
        customerGroupService.removeMember(id, memberId);
        return ApiResponse.ok("Da go khach hang khoi nhom", null);
    }
}
