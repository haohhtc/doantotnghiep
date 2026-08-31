package com.erpqlkho.backend.category.customer.controller;

import com.erpqlkho.backend.category.customer.dto.CustomerDto;
import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.service.CustomerService;
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
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ApiResponse<List<Customer>> findAll() {
        return ApiResponse.ok(customerService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Customer> findById(@PathVariable Long id) {
        return ApiResponse.ok(customerService.findById(id));
    }

    @PostMapping
    public ApiResponse<Customer> create(@Valid @RequestBody CustomerDto dto) {
        return ApiResponse.ok("Tao khach hang thanh cong", customerService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Customer> update(@PathVariable Long id, @Valid @RequestBody CustomerDto dto) {
        return ApiResponse.ok("Cap nhat khach hang thanh cong", customerService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deactivate(@PathVariable Long id) {
        customerService.deactivate(id);
        return ApiResponse.ok("Da ngung hop tac khach hang", null);
    }
}
