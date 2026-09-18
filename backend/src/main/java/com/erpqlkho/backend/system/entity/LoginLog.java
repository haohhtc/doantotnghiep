package com.erpqlkho.backend.system.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// Nhat ky dang nhap (thanh cong/that bai) - ghi trong AuthService.login(), boc try-catch rieng
// de loi ghi log KHONG duoc chan dang nhap that. Khong luu mat khau du dung hay sai.
@Getter
@Setter
@Entity
@Table(name = "login_log")
public class LoginLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private boolean success;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
