package com.erpqlkho.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String username;
    private String fullName;
    private String role;
    // Chi nhanh (NPP) nguoi dung dang thuoc ve - null neu ADMIN (Admin HO, khong gioi han chi
    // nhanh) hoac tai khoan chua duoc gan chi nhanh. Frontend dung de gui kem len AI Chatbot,
    // chan khong cho hoi du lieu cua chi nhanh/NPP khac - xem ai-services/chatbot/main.py.
    private String branchCode;
    private String branchName;
    // Danh sach ma quyen chi tiet DA DUOC GIAI QUYET (ADMIN = toan bo catalog, nguoi khac = dung
    // cot user.permissions) - Frontend luu vao localStorage, dung qua hasPermission() de an/hien
    // nut Them/Sua/Xac nhan/Huy... o 7 nhom uu tien (xem utils/auth.js, PermissionCatalog.java).
    private List<String> permissions;
}
