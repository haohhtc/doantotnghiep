package com.erpqlkho.backend.system.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// Cau hinh SMTP - CHI 1 dong (singleton, giong Company). KHONG gui email that (xem
// EmailService.sendSimulated) - xem tonghop.md.
@Getter
@Setter
@Entity
@Table(name = "email_config")
public class EmailConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "smtp_host")
    private String smtpHost;

    @Column(name = "smtp_port")
    private Integer smtpPort;

    @Column(name = "smtp_username")
    private String smtpUsername;

    // JsonIgnore: khong bao gio tra mat khau SMTP ve client.
    @JsonIgnore
    @Column(name = "smtp_password")
    private String smtpPassword;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
