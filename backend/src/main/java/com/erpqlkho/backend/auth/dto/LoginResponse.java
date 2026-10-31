package com.erpqlkho.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

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
}
