package com.erpqlkho.backend.category.employeeposition.controller;

import com.erpqlkho.backend.category.employeeposition.dto.EmployeePositionDto;
import com.erpqlkho.backend.category.employeeposition.entity.EmployeePosition;
import com.erpqlkho.backend.category.employeeposition.service.EmployeePositionService;
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
@RequestMapping("/api/employee-positions")
@RequiredArgsConstructor
public class EmployeePositionController {

    private final EmployeePositionService employeePositionService;

    @GetMapping
    public ApiResponse<List<EmployeePosition>> findAll() {
        return ApiResponse.ok(employeePositionService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<EmployeePosition> findById(@PathVariable Long id) {
        return ApiResponse.ok(employeePositionService.findById(id));
    }

    @PostMapping
    public ApiResponse<EmployeePosition> create(@Valid @RequestBody EmployeePositionDto dto) {
        return ApiResponse.ok("Tao chuc vu thanh cong", employeePositionService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<EmployeePosition> update(@PathVariable Long id, @Valid @RequestBody EmployeePositionDto dto) {
        return ApiResponse.ok("Cap nhat chuc vu thanh cong", employeePositionService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        employeePositionService.delete(id);
        return ApiResponse.ok("Da xoa chuc vu", null);
    }
}
