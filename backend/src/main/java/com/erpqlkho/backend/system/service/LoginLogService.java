package com.erpqlkho.backend.system.service;

import com.erpqlkho.backend.system.entity.LoginLog;
import com.erpqlkho.backend.system.repository.LoginLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

// Ghi nhat ky dang nhap (V25) - goi tu AuthService.login(). Propagation.REQUIRES_NEW: chay trong
// 1 transaction RIENG, tach biet hoan toan voi transaction dang nhap chinh - neu ghi log loi (vd
// trung token_hash do 2 lan dang nhap cung 1 giay sinh JWT giong het nhau), chi transaction NHO
// nay rollback, KHONG lam "nhiem doc" (mark rollback-only) transaction dang nhap chinh. Bat
// Exception rong de dang nhap that luon thanh cong du ghi log co loi hay khong.
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginLogService {

    private final LoginLogRepository loginLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String username, boolean success, HttpServletRequest request) {
        try {
            LoginLog entry = new LoginLog();
            entry.setUsername(username);
            entry.setSuccess(success);
            entry.setIpAddress(request.getRemoteAddr());
            entry.setUserAgent(request.getHeader("User-Agent"));
            entry.setCreatedAt(LocalDateTime.now());
            loginLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("Khong ghi duoc login_log cho username={}: {}", username, e.getMessage());
        }
    }
}
