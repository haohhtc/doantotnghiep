package com.erpqlkho.backend.system.repository;

import com.erpqlkho.backend.system.entity.ActiveSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActiveSessionRepository extends JpaRepository<ActiveSession, Long> {
    // Dung trong JwtAuthFilter - chay cho MOI request co xac thuc, phai nhanh (token_hash da co
    // UNIQUE index). Chi tra true khi TIM THAY dong VA revoked=true - khong tim thay dong (vd
    // token tao truoc khi co tinh nang nay) mac dinh KHONG chan, tranh khoa nham nguoi dung hop le.
    boolean existsByTokenHashAndRevokedTrue(String tokenHash);
}
