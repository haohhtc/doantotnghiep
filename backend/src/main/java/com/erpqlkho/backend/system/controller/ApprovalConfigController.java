package com.erpqlkho.backend.system.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.system.dto.ApprovalConfigDto;
import com.erpqlkho.backend.system.entity.ApprovalConfig;
import com.erpqlkho.backend.system.service.ApprovalConfigService;
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
@RequestMapping("/api/approval-configs")
@RequiredArgsConstructor
public class ApprovalConfigController {

    private final ApprovalConfigService approvalConfigService;

    @GetMapping
    public ApiResponse<List<ApprovalConfig>> findAll() {
        return ApiResponse.ok(approvalConfigService.findAll());
    }

    @PostMapping
    public ApiResponse<ApprovalConfig> create(@Valid @RequestBody ApprovalConfigDto dto) {
        return ApiResponse.ok("Tao cau hinh duyet thanh cong", approvalConfigService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<ApprovalConfig> update(@PathVariable Long id, @Valid @RequestBody ApprovalConfigDto dto) {
        return ApiResponse.ok("Cap nhat cau hinh duyet thanh cong", approvalConfigService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        approvalConfigService.delete(id);
        return ApiResponse.ok("Da xoa cau hinh duyet", null);
    }
}
