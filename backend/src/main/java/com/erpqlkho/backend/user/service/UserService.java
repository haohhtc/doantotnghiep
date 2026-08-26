package com.erpqlkho.backend.user.service;

import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.user.dto.UserDto;
import com.erpqlkho.backend.user.entity.Role;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.RoleRepository;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Transactional
    public User create(UserDto dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw ApiException.conflict("Ten dang nhap da ton tai: " + dto.getUsername());
        }
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new ApiException("Mat khau khong duoc de trong khi tao moi");
        }

        Role role = findRole(dto.getRoleCode());

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setRole(role);

        return userRepository.save(user);
    }

    @Transactional
    public User update(Long id, UserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay user id=" + id));

        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setRole(findRole(dto.getRoleCode()));

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        if (dto.getStatus() != null) {
            user.setStatus(User.UserStatus.valueOf(dto.getStatus()));
        }

        return userRepository.save(user);
    }

    @Transactional
    public void lock(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay user id=" + id));
        user.setStatus(User.UserStatus.LOCKED);
        userRepository.save(user);
    }

    private Role findRole(String code) {
        return roleRepository.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay role: " + code));
    }
}
