package com.erpqlkho.backend.category.warehouse.service;

import com.erpqlkho.backend.category.warehouse.dto.WarehouseDto;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;

    public List<Warehouse> findAll() {
        return warehouseRepository.findAll();
    }

    public Warehouse findById(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay kho id=" + id));
    }

    @Transactional
    public Warehouse create(WarehouseDto dto) {
        if (warehouseRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma kho da ton tai: " + dto.getCode());
        }

        Warehouse warehouse = new Warehouse();
        warehouse.setCode(dto.getCode());
        warehouse.setName(dto.getName());
        warehouse.setAddress(dto.getAddress());
        warehouse.setWarehouseType(dto.getWarehouseType() != null ? dto.getWarehouseType() : "MAIN");
        warehouse.setManager(findManager(dto.getManagerId()));
        warehouse.setActive(dto.getActive() == null || dto.getActive());

        return warehouseRepository.save(warehouse);
    }

    @Transactional
    public Warehouse update(Long id, WarehouseDto dto) {
        Warehouse warehouse = findById(id);

        if (!warehouse.getCode().equals(dto.getCode()) && warehouseRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma kho da ton tai: " + dto.getCode());
        }

        warehouse.setCode(dto.getCode());
        warehouse.setName(dto.getName());
        warehouse.setAddress(dto.getAddress());
        if (dto.getWarehouseType() != null) {
            warehouse.setWarehouseType(dto.getWarehouseType());
        }
        warehouse.setManager(findManager(dto.getManagerId()));
        if (dto.getActive() != null) {
            warehouse.setActive(dto.getActive());
        }

        return warehouseRepository.save(warehouse);
    }

    // Soft-delete (giong pattern ProductService): giu lai lich su vi warehouse co the
    // da duoc tham chieu boi goods_receipt / sales_order / stock.
    @Transactional
    public void deactivate(Long id) {
        Warehouse warehouse = findById(id);
        warehouse.setActive(false);
        warehouseRepository.save(warehouse);
    }

    private User findManager(Long managerId) {
        if (managerId == null) {
            return null;
        }
        return userRepository.findById(managerId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nguoi quan ly id=" + managerId));
    }
}
