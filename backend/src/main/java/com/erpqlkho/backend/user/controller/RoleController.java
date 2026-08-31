package com.erpqlkho.backend.user.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.user.dto.RoleDto;
import com.erpqlkho.backend.user.entity.Role;
import com.erpqlkho.backend.user.service.RoleService;
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
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public ApiResponse<List<Role>> findAll() {
        return ApiResponse.ok(roleService.findAll());
    }

    @PostMapping
    public ApiResponse<Role> create(@Valid @RequestBody RoleDto dto) {
        return ApiResponse.ok("Tao vai tro thanh cong", roleService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Role> update(@PathVariable Long id, @Valid @RequestBody RoleDto dto) {
        return ApiResponse.ok("Cap nhat vai tro thanh cong", roleService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        roleService.delete(id);
        return ApiResponse.ok("Da xoa vai tro", null);
    }
}
