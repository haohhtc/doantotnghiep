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

    // Soft-delete (giong pattern ProductService): giu lai lich su vi supplier
    // co the da duoc tham chieu boi goods_receipt.
    @Transactional
    public void deactivate(Long id) {
        Supplier supplier = findById(id);
        supplier.setActive(false);
        supplierRepository.save(supplier);
    }
}
