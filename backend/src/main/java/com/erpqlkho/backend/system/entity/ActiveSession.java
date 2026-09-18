package com.erpqlkho.backend.system.entity;

import com.erpqlkho.backend.user.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// Login Device Management (V30) - RUI RO CAO NHAT trong nhom Quan tri, dung vao JwtAuthFilter
// (chay cho MOI request co xac thuc) - xem tonghop.md. Khong luu token goc, chi luu token_hash.
@Getter
@Setter
@Entity
@Table(name = "active_session")
public class ActiveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // JsonIgnore: khong bao gio tra hash token ve client (khong can thiet, chi de tra cuu noi bo).
    // KHONG unique (xem V31) - JWT chi chinh xac toi giay nen 2 lan dang nhap cung giay co the
    // trung token, existsByTokenHashAndRevokedTrue() van dung dung ke ca khi trung.
    @JsonIgnore
    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "login_at")
    private LocalDateTime loginAt;

    @Column(nullable = false)
    private boolean revoked = false;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;
}
