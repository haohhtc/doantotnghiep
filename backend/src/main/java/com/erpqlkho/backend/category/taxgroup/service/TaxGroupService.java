package com.erpqlkho.backend.category.taxgroup.service;

import com.erpqlkho.backend.category.taxgroup.dto.TaxGroupDto;
import com.erpqlkho.backend.category.taxgroup.entity.TaxGroup;
import com.erpqlkho.backend.category.taxgroup.repository.TaxGroupRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaxGroupService {

    private final TaxGroupRepository taxGroupRepository;

    public List<TaxGroup> findAll() {
        return taxGroupRepository.findAll();
    }

    public TaxGroup findById(Long id) {
        return taxGroupRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nhom thue id=" + id));
    }

    @Transactional
    public TaxGroup create(TaxGroupDto dto) {
        if (taxGroupRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhom thue da ton tai: " + dto.getCode());
        }
        TaxGroup taxGroup = new TaxGroup();
        taxGroup.setCode(dto.getCode());
        taxGroup.setName(dto.getName());
        taxGroup.setRatePercent(dto.getRatePercent());
        return taxGroupRepository.save(taxGroup);
    }

    @Transactional
    public TaxGroup update(Long id, TaxGroupDto dto) {
        TaxGroup taxGroup = findById(id);
        if (!taxGroup.getCode().equals(dto.getCode()) && taxGroupRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhom thue da ton tai: " + dto.getCode());
        }
        taxGroup.setCode(dto.getCode());
        taxGroup.setName(dto.getName());
        taxGroup.setRatePercent(dto.getRatePercent());
        return taxGroupRepository.save(taxGroup);
    }

    // Xoa that (hard delete) - chan neu dang bi product tham chieu.
    @Transactional
    public void delete(Long id) {
        TaxGroup taxGroup = findById(id);
        try {
            taxGroupRepository.delete(taxGroup);
            taxGroupRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: nhom thue dang duoc san pham khac su dung");
        }
    }
}
