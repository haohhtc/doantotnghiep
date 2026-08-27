package com.erpqlkho.backend.auth.service;

import com.erpqlkho.backend.auth.dto.LoginRequest;
import com.erpqlkho.backend.auth.dto.LoginResponse;
import com.erpqlkho.backend.auth.security.JwtUtil;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
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

    // @Transactional: giu Hibernate session mo trong luc method chay, vi user.getRole()
    // la LAZY va se nem LazyInitializationException neu goi sau khi session da dong.
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sai ten dang nhap hoac mat khau");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> ApiException.notFound("Khong tim thay tai khoan"));

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().getCode());

        return new LoginResponse(token, user.getUsername(), user.getFullName(), user.getRole().getCode());
    }
}
