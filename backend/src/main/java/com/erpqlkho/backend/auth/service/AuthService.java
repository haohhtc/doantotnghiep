package com.erpqlkho.backend.auth.service;

import com.erpqlkho.backend.auth.dto.LoginRequest;
import com.erpqlkho.backend.auth.dto.LoginResponse;
import com.erpqlkho.backend.auth.security.JwtUtil;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.system.service.ActiveSessionService;
import com.erpqlkho.backend.system.service.LoginLogService;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final LoginLogService loginLogService;
    private final ActiveSessionService activeSessionService;
    private final HttpServletRequest httpServletRequest;

    // @Transactional: giu Hibernate session mo trong luc method chay, vi user.getRole() la LAZY.
    // loginLogService/activeSessionService tu chay trong transaction RIENG (REQUIRES_NEW) nen
    // khong the "nhiem doc" transaction nay du ghi log co loi hay khong - xem LoginLogService.
    @Transactional
    public LoginResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (BadCredentialsException e) {
            loginLogService.record(request.getUsername(), false, httpServletRequest);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sai ten dang nhap hoac mat khau");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> ApiException.notFound("Khong tim thay tai khoan"));

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().getCode());
        loginLogService.record(request.getUsername(), true, httpServletRequest);
        activeSessionService.recordSession(user, token, httpServletRequest);

        return new LoginResponse(token, user.getUsername(), user.getFullName(), user.getRole().getCode());
    }
}
