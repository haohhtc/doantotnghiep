package com.erpqlkho.backend.category.employeeposition.service;

import com.erpqlkho.backend.category.employeeposition.dto.EmployeePositionDto;
import com.erpqlkho.backend.category.employeeposition.entity.EmployeePosition;
import com.erpqlkho.backend.category.employeeposition.repository.EmployeePositionRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeePositionService {

    private final EmployeePositionRepository employeePositionRepository;

    public List<EmployeePosition> findAll() {
        return employeePositionRepository.findAll();
    }

    public EmployeePosition findById(Long id) {
        return employeePositionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay chuc vu id=" + id));
    }

    @Transactional
    public EmployeePosition create(EmployeePositionDto dto) {
        if (employeePositionRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma chuc vu da ton tai: " + dto.getCode());
        }
        EmployeePosition position = new EmployeePosition();
        position.setCode(dto.getCode());
        position.setName(dto.getName());
        position.setDescription(dto.getDescription());
        return employeePositionRepository.save(position);
    }

    @Transactional
    public EmployeePosition update(Long id, EmployeePositionDto dto) {
        EmployeePosition position = findById(id);
        if (!position.getCode().equals(dto.getCode()) && employeePositionRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma chuc vu da ton tai: " + dto.getCode());
        }
        position.setCode(dto.getCode());
        position.setName(dto.getName());
        position.setDescription(dto.getDescription());
        return employeePositionRepository.save(position);
    }

    @Transactional
    public void delete(Long id) {
        EmployeePosition position = findById(id);
        try {
            employeePositionRepository.delete(position);
            employeePositionRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: chuc vu dang duoc nguoi dung khac su dung");
        }
    }
}
