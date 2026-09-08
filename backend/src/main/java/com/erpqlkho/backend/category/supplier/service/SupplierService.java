package com.erpqlkho.backend.category.supplier.service;

import com.erpqlkho.backend.category.supplier.dto.SupplierDto;
import com.erpqlkho.backend.category.supplier.entity.Supplier;
import com.erpqlkho.backend.category.supplier.repository.SupplierRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public List<Supplier> findAll() {
        return supplierRepository.findAll();
    }

    public Supplier findById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nha cung cap id=" + id));
    }

    @Transactional
    public Supplier create(SupplierDto dto) {
        if (supplierRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nha cung cap da ton tai: " + dto.getCode());
        }

        Supplier supplier = new Supplier();
        supplier.setCode(dto.getCode());
        supplier.setName(dto.getName());
        supplier.setForeignName(dto.getForeignName());
        supplier.setContactPerson(dto.getContactPerson());
        supplier.setPhone(dto.getPhone());
        supplier.setEmail(dto.getEmail());
        supplier.setAddress(dto.getAddress());
        supplier.setActive(dto.getActive() == null || dto.getActive());

        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier update(Long id, SupplierDto dto) {
        Supplier supplier = findById(id);

        if (!supplier.getCode().equals(dto.getCode()) && supplierRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nha cung cap da ton tai: " + dto.getCode());
        }

        supplier.setCode(dto.getCode());
        supplier.setName(dto.getName());
        supplier.setForeignName(dto.getForeignName());
        supplier.setContactPerson(dto.getContactPerson());
        supplier.setPhone(dto.getPhone());
        supplier.setEmail(dto.getEmail());
        supplier.setAddress(dto.getAddress());
        if (dto.getActive() != null) {
            supplier.setActive(dto.getActive());
        }

        return supplierRepository.save(supplier);
    }

    // TAM THOI doi tu soft-delete sang xoa that (hard delete) theo yeu cau - de admin don duoc
    // du lieu test/rac khoi DB. Van chan neu dang bi tham chieu boi goods_receipt de khong pha
    // rang buoc khoa ngoai. Muon quay lai soft-delete: doi than ham nay ve
    // "supplier.setActive(false); supplierRepository.save(supplier);".
    @Transactional
    public void deactivate(Long id) {
        Supplier supplier = findById(id);
        try {
            supplierRepository.delete(supplier);
            supplierRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: nha cung cap dang duoc su dung o phieu nhap khac");
        }
    }
}
