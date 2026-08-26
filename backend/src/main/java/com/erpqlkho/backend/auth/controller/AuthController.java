package com.erpqlkho.backend.auth.controller;

import com.erpqlkho.backend.auth.dto.LoginRequest;
import com.erpqlkho.backend.auth.dto.LoginResponse;
import com.erpqlkho.backend.auth.service.AuthService;
import com.erpqlkho.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Dang nhap thanh cong", authService.login(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        // JWT stateless: client tu xoa token. Neu can revoke, bo sung blacklist token o day.
        return ApiResponse.ok("Dang xuat thanh cong", null);
    }
}
