package com.erpqlkho.backend.category.salesmantype.service;

import com.erpqlkho.backend.category.salesmantype.dto.SalesmanTypeDto;
import com.erpqlkho.backend.category.salesmantype.entity.SalesmanType;
import com.erpqlkho.backend.category.salesmantype.repository.SalesmanTypeRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SalesmanTypeService {

    private final SalesmanTypeRepository salesmanTypeRepository;

    public List<SalesmanType> findAll() {
        return salesmanTypeRepository.findAll();
    }

    public SalesmanType findById(Long id) {
        return salesmanTypeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay loai nhan vien ban hang id=" + id));
    }

    @Transactional
    public SalesmanType create(SalesmanTypeDto dto) {
        if (salesmanTypeRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma loai nhan vien ban hang da ton tai: " + dto.getCode());
        }
        SalesmanType type = new SalesmanType();
        type.setCode(dto.getCode());
        type.setName(dto.getName());
        type.setDescription(dto.getDescription());
        return salesmanTypeRepository.save(type);
    }

    @Transactional
    public SalesmanType update(Long id, SalesmanTypeDto dto) {
        SalesmanType type = findById(id);
        if (!type.getCode().equals(dto.getCode()) && salesmanTypeRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma loai nhan vien ban hang da ton tai: " + dto.getCode());
        }
        type.setCode(dto.getCode());
        type.setName(dto.getName());
        type.setDescription(dto.getDescription());
        return salesmanTypeRepository.save(type);
    }

    @Transactional
    public void delete(Long id) {
        SalesmanType type = findById(id);
        try {
            salesmanTypeRepository.delete(type);
            salesmanTypeRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: loai nhan vien ban hang dang duoc nguoi dung khac su dung");
        }
    }
}
