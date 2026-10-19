package com.erpqlkho.backend.inventory.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.inventory.entity.EmployeeStock;
import com.erpqlkho.backend.inventory.service.EmployeeStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

// "Tồn NV" (App Van-Sale, di dong) - xem EmployeeStock.java. Chi xem, khong co tao/sua truc tiep -
// so lieu chi doi theo Ung hang/Tra hang/Don Van Sale.
@RestController
@RequestMapping("/api/employee-stocks")
@RequiredArgsConstructor
public class EmployeeStockController {

    private final EmployeeStockService employeeStockService;

    @GetMapping("/by-employee/{employeeId}")
    public ApiResponse<List<EmployeeStock>> findByEmployee(@PathVariable Long employeeId) {
        return ApiResponse.ok(employeeStockService.findByEmployee(employeeId));
    }

    // "Dau ngay / Da nhan / Da xuat / Con lai" theo ngay (yeu cau cua tv2) - de trong ngay = hom nay.
    @GetMapping("/by-employee/{employeeId}/summary")
    public ApiResponse<List<EmployeeStockService.DailySummary>> dailySummary(
            @PathVariable Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.ok(employeeStockService.dailySummary(employeeId, date != null ? date : LocalDate.now()));
    }
}
