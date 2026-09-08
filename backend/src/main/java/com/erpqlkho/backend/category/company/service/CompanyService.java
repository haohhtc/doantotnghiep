package com.erpqlkho.backend.category.company.service;

import com.erpqlkho.backend.category.company.dto.CompanyDto;
import com.erpqlkho.backend.category.company.entity.Company;
import com.erpqlkho.backend.category.company.repository.CompanyRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    // Chi co dung 1 ban ghi - lay ban dau tien tim thay (da seed san trong V12).
    public Company get() {
        return companyRepository.findAll().stream().findFirst()
                .orElseThrow(() -> ApiException.notFound("Chua co du lieu cong ty"));
    }

    @Transactional
    public Company update(CompanyDto dto) {
        Company company = get();
        company.setCode(dto.getCode());
        company.setName(dto.getName());
        company.setTaxCode(dto.getTaxCode());
        company.setAddress(dto.getAddress());
        company.setPhone(dto.getPhone());
        return companyRepository.save(company);
    }
}
