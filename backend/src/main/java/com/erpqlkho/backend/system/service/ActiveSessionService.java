package com.erpqlkho.backend.system.service;

import com.erpqlkho.backend.auth.security.JwtUtil;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.system.entity.ActiveSession;
import com.erpqlkho.backend.system.repository.ActiveSessionRepository;
import com.erpqlkho.backend.user.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// Login Device Management (V30) - xem tonghop.md muc "Quan tri", RUI RO CAO NHAT (JwtAuthFilter
// doc bang nay o MOI request).
@Slf4j
@Service
@RequiredArgsConstructor
public class ActiveSessionService {

    private final ActiveSessionRepository activeSessionRepository;

    public List<ActiveSession> findAll() {
        return activeSessionRepository.findAll();
    }

    // Ghi 1 dong moi moi lan dang nhap thanh cong - goi tu AuthService.login().
    // Propagation.REQUIRES_NEW: transaction rieng, tach biet voi transaction dang nhap chinh -
    // neu ghi loi (vd trung token_hash) chi transaction nay rollback, KHONG lam "nhiem doc"
    // (mark rollback-only) transaction dang nhap chinh - xem LoginLogService de biet chi tiet
    // nguyen nhan can lam the nay (khong chi don gian bat Exception la du).
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSession(User user, String token, HttpServletRequest request) {
        try {
            ActiveSession session = new ActiveSession();
            session.setUser(user);
            session.setTokenHash(JwtUtil.hashToken(token));
            session.setDeviceInfo(request.getHeader("User-Agent"));
            session.setIpAddress(request.getRemoteAddr());
            session.setLoginAt(LocalDateTime.now());
            session.setRevoked(false);
            activeSessionRepository.save(session);
        } catch (Exception e) {
            log.warn("Khong ghi duoc active_session cho user={}: {}", user.getUsername(), e.getMessage());
        }
    }

    @Transactional
    public ActiveSession revoke(Long id) {
        ActiveSession session = activeSessionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phien dang nhap id=" + id));
        session.setRevoked(true);
        session.setRevokedAt(LocalDateTime.now());
        return activeSessionRepository.save(session);
    }
}
