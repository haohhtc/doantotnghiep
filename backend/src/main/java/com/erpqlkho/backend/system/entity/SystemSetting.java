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

// Cau hinh chung (key-value) - du lieu luu tru/hien thi, co the chua co noi nao doc/ap dung gia
// tri cu the o phien ban nay - xem tonghop.md.
@Getter
@Setter
@Entity
@Table(name = "system_setting")
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "setting_key", nullable = false, unique = true, length = 100)
    private String settingKey;

    @Column(name = "setting_value", length = 500)
    private String settingValue;

    @Column(length = 255)
    private String description;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
