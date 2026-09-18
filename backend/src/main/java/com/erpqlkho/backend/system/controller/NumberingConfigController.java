package com.erpqlkho.backend.system.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.system.dto.NumberingConfigDto;
import com.erpqlkho.backend.system.entity.NumberingConfig;
import com.erpqlkho.backend.system.service.NumberingConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/numbering-configs")
@RequiredArgsConstructor
public class NumberingConfigController {

    private final NumberingConfigService numberingConfigService;

    @GetMapping
    public ApiResponse<List<NumberingConfig>> findAll() {
        return ApiResponse.ok(numberingConfigService.findAll());
    }

    @PutMapping("/{id}")
    public ApiResponse<NumberingConfig> updatePrefix(@PathVariable Long id, @Valid @RequestBody NumberingConfigDto dto) {
        return ApiResponse.ok("Cap nhat tien to thanh cong", numberingConfigService.updatePrefix(id, dto));
    }
}
