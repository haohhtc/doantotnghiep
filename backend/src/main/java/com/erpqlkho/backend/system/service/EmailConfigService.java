package com.erpqlkho.backend.system.service;

import com.erpqlkho.backend.system.dto.EmailConfigDto;
import com.erpqlkho.backend.system.dto.EmailSendDto;
import com.erpqlkho.backend.system.entity.EmailConfig;
import com.erpqlkho.backend.system.entity.EmailLog;
import com.erpqlkho.backend.system.repository.EmailConfigRepository;
import com.erpqlkho.backend.system.repository.EmailLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// Cau hinh SMTP dang singleton (1 dong duy nhat, giong Company) + gui email GIA LAP (khong goi
// SMTP that - tranh rui ro fail demo do mang chan SMTP va tranh ro ri thong tin dang nhap email) -
// xem tonghop.md.
@Service
@RequiredArgsConstructor
public class EmailConfigService {

    private final EmailConfigRepository emailConfigRepository;
    private final EmailLogRepository emailLogRepository;

    public EmailConfig getConfig() {
        return emailConfigRepository.findAll().stream().findFirst().orElseGet(EmailConfig::new);
    }

    @Transactional
    public EmailConfig saveConfig(EmailConfigDto dto) {
        EmailConfig config = emailConfigRepository.findAll().stream().findFirst().orElseGet(EmailConfig::new);
        config.setSmtpHost(dto.getSmtpHost());
        config.setSmtpPort(dto.getSmtpPort());
        config.setSmtpUsername(dto.getSmtpUsername());
        if (dto.getSmtpPassword() != null && !dto.getSmtpPassword().isBlank()) {
            config.setSmtpPassword(dto.getSmtpPassword());
        }
        config.setUpdatedAt(LocalDateTime.now());
        return emailConfigRepository.save(config);
    }

    public List<EmailLog> findLogs() {
        return emailLogRepository.findAll();
    }

    // Gia lap gui email: chi ghi vao email_log, KHONG goi SMTP that - giong cach nut "Xuat file"
    // da lam gia lap truoc day.
    @Transactional
    public EmailLog sendSimulated(EmailSendDto dto) {
        EmailLog log = new EmailLog();
        log.setRecipient(dto.getRecipient());
        log.setSubject(dto.getSubject());
        log.setBody(dto.getBody());
        log.setSentAt(LocalDateTime.now());
        return emailLogRepository.save(log);
    }
}
