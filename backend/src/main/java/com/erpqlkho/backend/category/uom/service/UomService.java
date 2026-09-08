package com.erpqlkho.backend.category.uom.service;

import com.erpqlkho.backend.category.uom.dto.UomDto;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uom.repository.UomRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UomService {

    private final UomRepository uomRepository;

    public List<Uom> findAll() {
        return uomRepository.findAll();
    }

    public Uom findById(Long id) {
        return uomRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don vi tinh id=" + id));
    }

    @Transactional
    public Uom create(UomDto dto) {
        if (uomRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma don vi tinh da ton tai: " + dto.getCode());
        }
        Uom uom = new Uom();
        uom.setCode(dto.getCode());
        uom.setName(dto.getName());
        return uomRepository.save(uom);
    }

    @Transactional
    public Uom update(Long id, UomDto dto) {
        Uom uom = findById(id);
        if (!uom.getCode().equals(dto.getCode()) && uomRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma don vi tinh da ton tai: " + dto.getCode());
        }
        uom.setCode(dto.getCode());
        uom.setName(dto.getName());
        return uomRepository.save(uom);
    }

    // Xoa that (hard delete) - chan neu dang bi uom_group/uom_conversion/product tham chieu.
    @Transactional
    public void delete(Long id) {
        Uom uom = findById(id);
        try {
            uomRepository.delete(uom);
            uomRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: don vi tinh dang duoc su dung o nhom quy doi hoac san pham khac");
        }
    }
}
