package com.erpqlkho.backend.category.employee.controller;

import com.erpqlkho.backend.category.employee.dto.EmployeeDto;
import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.category.employee.service.EmployeeService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    // ?type=NVBH|NV de loc theo tab.
    @GetMapping
    public ApiResponse<List<Employee>> findAll(@RequestParam(required = false) String type) {
        return ApiResponse.ok(employeeService.findAll(type));
    }

    @GetMapping("/{id}")
    public ApiResponse<Employee> findById(@PathVariable Long id) {
        return ApiResponse.ok(employeeService.findById(id));
    }

    @PostMapping
    public ApiResponse<Employee> create(@Valid @RequestBody EmployeeDto dto) {
        return ApiResponse.ok("Tao nhan vien thanh cong", employeeService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Employee> update(@PathVariable Long id, @Valid @RequestBody EmployeeDto dto) {
        return ApiResponse.ok("Cap nhat nhan vien thanh cong", employeeService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deactivate(@PathVariable Long id) {
        employeeService.deactivate(id);
        return ApiResponse.ok("Da xoa nhan vien", null);
    }
}
