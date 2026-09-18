package com.erpqlkho.backend.auth.security;

import com.erpqlkho.backend.system.repository.ActiveSessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final ActiveSessionRepository activeSessionRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtUtil.isValid(token) && !isRevoked(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
                String username = jwtUtil.extractUsername(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        chain.doFilter(request, response);
    }

    // Login Device Management (V30) - diem rui ro cao nhat, chay cho MOI request co xac thuc.
    // FAIL-OPEN co chu dich: bat ky loi/truong hop bat thuong nao (khong tim thay dong, loi DB...)
    // deu tra ve false (KHONG revoked) thay vi chan request - uu tien khong lam gian doan nguoi
    // dung hop le hon la hoan thien tinh nang thu hoi phien - xem tonghop.md.
    private boolean isRevoked(String token) {
        try {
            return activeSessionRepository.existsByTokenHashAndRevokedTrue(JwtUtil.hashToken(token));
        } catch (Exception e) {
            log.warn("Khong kiem tra duoc active_session, cho qua (fail-open): {}", e.getMessage());
            return false;
        }
    }
}
