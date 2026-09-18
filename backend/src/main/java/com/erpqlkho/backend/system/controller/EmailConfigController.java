package com.erpqlkho.backend.system.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.system.dto.EmailConfigDto;
import com.erpqlkho.backend.system.dto.EmailSendDto;
import com.erpqlkho.backend.system.entity.EmailConfig;
import com.erpqlkho.backend.system.entity.EmailLog;
import com.erpqlkho.backend.system.service.EmailConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EmailConfigController {

    private final EmailConfigService emailConfigService;

    @GetMapping("/api/email-config")
    public ApiResponse<EmailConfig> getConfig() {
        return ApiResponse.ok(emailConfigService.getConfig());
    }

    @PutMapping("/api/email-config")
    public ApiResponse<EmailConfig> saveConfig(@RequestBody EmailConfigDto dto) {
        return ApiResponse.ok("Cap nhat cau hinh email thanh cong", emailConfigService.saveConfig(dto));
    }

    @GetMapping("/api/email-logs")
    public ApiResponse<List<EmailLog>> findLogs() {
        return ApiResponse.ok(emailConfigService.findLogs());
    }

    // Gia lap gui email - khong goi SMTP that, chi ghi log.
    @PostMapping("/api/email-logs/send")
    public ApiResponse<EmailLog> send(@Valid @RequestBody EmailSendDto dto) {
        return ApiResponse.ok("Da gui email (gia lap)", emailConfigService.sendSimulated(dto));
    }
}
