package com.erpqlkho.backend.category.company.controller;

import com.erpqlkho.backend.category.company.dto.CompanyDto;
import com.erpqlkho.backend.category.company.entity.Company;
import com.erpqlkho.backend.category.company.service.CompanyService;
import com.erpqlkho.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Chi co GET/PUT (singleton, khong tao/xoa duoc) - xem xong CompanyService.
@RestController
@RequestMapping("/api/company")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    public ApiResponse<Company> get() {
        return ApiResponse.ok(companyService.get());
    }

    @PutMapping
    public ApiResponse<Company> update(@Valid @RequestBody CompanyDto dto) {
        return ApiResponse.ok("Cap nhat thong tin cong ty thanh cong", companyService.update(dto));
    }
}
