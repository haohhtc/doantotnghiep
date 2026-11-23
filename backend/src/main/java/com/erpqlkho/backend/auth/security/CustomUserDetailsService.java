package com.erpqlkho.backend.auth.security;

import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Khong tim thay tai khoan: " + username));

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .disabled(user.getStatus() == User.UserStatus.LOCKED)
                .authorities(buildAuthorities(user))
                .build();
    }

    // ROLE_xxx nhu cu (dung cho cac trang NGOAI 7 nhom uu tien, van kiem tra theo Role) + them
    // PERM_<ma quyen> cho he thong Phan quyen chi tiet moi (xem PermissionCatalog.java). ADMIN luon
    // duoc gan TOAN BO quyen tu dong (khong doc cot user.permissions) - khop "Grant all permissions"
    // luon khoa o man Phan quyen.
    private List<GrantedAuthority> buildAuthorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getCode()));

        String codes = "ADMIN".equals(user.getRole().getCode())
                ? com.erpqlkho.backend.auth.security.PermissionCatalog.allCodesJoined()
                : user.getPermissions();
        if (codes != null && !codes.isBlank()) {
            for (String code : codes.split(",")) {
                String trimmed = code.trim();
                if (!trimmed.isEmpty()) {
                    authorities.add(new SimpleGrantedAuthority("PERM_" + trimmed));
                }
            }
        }
        return authorities;
    }
}
