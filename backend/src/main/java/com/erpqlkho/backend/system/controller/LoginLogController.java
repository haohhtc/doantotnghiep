package com.erpqlkho.backend.system.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.system.entity.LoginLog;
import com.erpqlkho.backend.system.repository.LoginLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Chi ADMIN xem duoc (xem SecurityConfig) - day la log bat bien, khong co CRUD.
@RestController
@RequestMapping("/api/login-logs")
@RequiredArgsConstructor
public class LoginLogController {

    private final LoginLogRepository loginLogRepository;

    @GetMapping
    public ApiResponse<List<LoginLog>> findAll() {
        return ApiResponse.ok(loginLogRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));
    }
}
