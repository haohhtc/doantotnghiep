package com.erpqlkho.backend.category.employee.service;

import com.erpqlkho.backend.category.employee.dto.EmployeeDto;
import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.category.employee.repository.EmployeeRepository;
import com.erpqlkho.backend.category.employeeposition.entity.EmployeePosition;
import com.erpqlkho.backend.category.employeeposition.repository.EmployeePositionRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private static final Set<String> VALID_TYPES = Set.of("NVBH", "NV");

    private final EmployeeRepository employeeRepository;
    private final EmployeePositionRepository employeePositionRepository;
    private final UserRepository userRepository;

    // ?type=NVBH|NV de loc theo tab - bo trong thi tra toan bo.
    public List<Employee> findAll(String type) {
        return type != null ? employeeRepository.findByType(type) : employeeRepository.findAll();
    }

    public Employee findById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nhan vien id=" + id));
    }

    @Transactional
    public Employee create(EmployeeDto dto) {
        if (employeeRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhan vien da ton tai: " + dto.getCode());
        }
        Employee employee = new Employee();
        applyDto(employee, dto);
        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee update(Long id, EmployeeDto dto) {
        Employee employee = findById(id);
        if (!employee.getCode().equals(dto.getCode()) && employeeRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhan vien da ton tai: " + dto.getCode());
        }
        applyDto(employee, dto);
        return employeeRepository.save(employee);
    }

    @Transactional
    public void deactivate(Long id) {
        Employee employee = findById(id);
        try {
            employeeRepository.delete(employee);
            employeeRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: nhan vien dang duoc su dung o tuyen ban hang khac");
        }
    }

    private void applyDto(Employee employee, EmployeeDto dto) {
        if (!VALID_TYPES.contains(dto.getType())) {
            throw new ApiException("Loai nhan vien phai la NVBH hoac NV");
        }
        employee.setType(dto.getType());
        employee.setCode(dto.getCode());
        employee.setFullName(dto.getFullName());
        employee.setPhone(dto.getPhone());
        employee.setEmail(dto.getEmail());
        employee.setGender(dto.getGender());
        employee.setBirthDate(dto.getBirthDate());
        employee.setAddress(dto.getAddress());
        employee.setIdCardNumber(dto.getIdCardNumber());
        employee.setTaxCode(dto.getTaxCode());
        employee.setPosition(findPosition(dto.getPositionId()));
        employee.setHireDate(dto.getHireDate());
        employee.setResignDate(dto.getResignDate());
        employee.setDeliveryMan(dto.getDeliveryMan() != null && dto.getDeliveryMan());
        employee.setActive(dto.getActive() == null || dto.getActive());
        employee.setUser(findUser(dto.getUserId()));
    }

    private EmployeePosition findPosition(Long id) {
        if (id == null) return null;
        return employeePositionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay chuc vu id=" + id));
    }

    private User findUser(Long id) {
        if (id == null) return null;
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nguoi dung id=" + id));
    }
}
