package com.erpqlkho.backend.category.customergroup.controller;

import com.erpqlkho.backend.category.customergroup.dto.CustomerGroupDto;
import com.erpqlkho.backend.category.customergroup.entity.CustomerGroup;
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
}
