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

// Nhat ky "gui" email gia lap - xem EmailService.sendSimulated (khong goi SMTP that).
@Getter
@Setter
@Entity
@Table(name = "email_log")
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String recipient;

    private String subject;

    @Column(length = 2000)
    private String body;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
