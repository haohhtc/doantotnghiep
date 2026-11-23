package com.erpqlkho.backend.auth.controller;

import com.erpqlkho.backend.auth.security.PermissionCatalog;
import com.erpqlkho.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Danh muc quyen chi tiet (dung de ve cay checkbox o modal "Phan quyen" - xem
// frontend/.../pages/system/Users/index.jsx). Nguon du lieu DUY NHAT la PermissionCatalog.java,
// Frontend khong tu dinh nghia lai tranh lech.
@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {

    @GetMapping("/catalog")
    public ApiResponse<List<PermissionCatalog.GroupDef>> catalog() {
        return ApiResponse.ok(PermissionCatalog.GROUPS);
    }
}
