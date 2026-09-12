package com.erpqlkho.backend.category.customergroup.service;

import com.erpqlkho.backend.category.customergroup.dto.CustomerGroupDto;
import com.erpqlkho.backend.category.customergroup.entity.CustomerGroup;
import com.erpqlkho.backend.category.customergroup.repository.CustomerGroupRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerGroupService {

    private final CustomerGroupRepository customerGroupRepository;

    public List<CustomerGroup> findAll() {
        return customerGroupRepository.findAll();
    }

    public CustomerGroup findById(Long id) {
        return customerGroupRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nhom khach hang id=" + id));
    }

    @Transactional
    public CustomerGroup create(CustomerGroupDto dto) {
        if (customerGroupRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhom khach hang da ton tai: " + dto.getCode());
        }
        CustomerGroup group = new CustomerGroup();
        group.setCode(dto.getCode());
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        return customerGroupRepository.save(group);
    }

    @Transactional
    public CustomerGroup update(Long id, CustomerGroupDto dto) {
        CustomerGroup group = findById(id);
        if (!group.getCode().equals(dto.getCode()) && customerGroupRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhom khach hang da ton tai: " + dto.getCode());
        }
        group.setCode(dto.getCode());
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        return customerGroupRepository.save(group);
    }

    @Transactional
    public void delete(Long id) {
        CustomerGroup group = findById(id);
        try {
            customerGroupRepository.delete(group);
            customerGroupRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: nhom khach hang dang duoc khach hang khac su dung");
        }
    }
}
