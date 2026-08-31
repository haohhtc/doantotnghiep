package com.erpqlkho.backend.user.service;

import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.user.dto.RoleDto;
import com.erpqlkho.backend.user.entity.Role;
import com.erpqlkho.backend.user.repository.RoleRepository;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    public Role findById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay vai tro id=" + id));
    }

    @Transactional
    public Role create(RoleDto dto) {
        if (roleRepository.findByCode(dto.getCode()).isPresent()) {
            throw ApiException.conflict("Ma vai tro da ton tai: " + dto.getCode());
        }

        Role role = new Role();
        role.setCode(dto.getCode());
        role.setName(dto.getName());
        role.setDescription(dto.getDescription());

        return roleRepository.save(role);
    }

    @Transactional
    public Role update(Long id, RoleDto dto) {
        Role role = findById(id);

        if (!role.getCode().equals(dto.getCode()) && roleRepository.findByCode(dto.getCode()).isPresent()) {
            throw ApiException.conflict("Ma vai tro da ton tai: " + dto.getCode());
        }

        role.setCode(dto.getCode());
        role.setName(dto.getName());
        role.setDescription(dto.getDescription());

        return roleRepository.save(role);
    }

    // Xoa han (khong soft-delete duoc vi role khong co cot active) - chan neu con user dang gan role nay.
    @Transactional
    public void delete(Long id) {
        Role role = findById(id);
        if (userRepository.existsByRoleId(id)) {
            throw ApiException.conflict("Khong the xoa: van con nguoi dung dang gan vai tro nay");
        }
        roleRepository.delete(role);
    }
}
