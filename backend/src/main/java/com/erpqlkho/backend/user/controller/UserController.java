package com.erpqlkho.backend.user.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.user.dto.UserDto;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<List<User>> findAll() {
        return ApiResponse.ok(userService.findAll());
    }

    @PostMapping
    public ApiResponse<User> create(@Valid @RequestBody UserDto dto) {
        return ApiResponse.ok("Tao nguoi dung thanh cong", userService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<User> update(@PathVariable Long id, @Valid @RequestBody UserDto dto) {
        return ApiResponse.ok("Cap nhat thanh cong", userService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> lock(@PathVariable Long id) {
        userService.lock(id);
        return ApiResponse.ok("Da khoa tai khoan", null);
    }

    // Phan quyen chi tiet (trang x hanh dong) - xem PermissionCatalog.java, Users/index.jsx nut
    // "Phan quyen". GET /api/users da tra ve san truong permissions cua tung user (serialize entity
    // binh thuong) nen khong can API doc rieng.
    @PutMapping("/{id}/permissions")
    public ApiResponse<User> updatePermissions(@PathVariable Long id, @RequestBody List<String> codes) {
        return ApiResponse.ok("Da cap nhat phan quyen", userService.updatePermissions(id, codes));
    }
}
