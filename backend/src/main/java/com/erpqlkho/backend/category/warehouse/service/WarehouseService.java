package com.erpqlkho.backend.category.warehouse.service;

import com.erpqlkho.backend.category.branch.entity.Branch;
import com.erpqlkho.backend.category.branch.repository.BranchRepository;
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
    private final BranchRepository branchRepository;

    // ?branchId= de loc theo Chi nhanh - bo trong thi tra toan bo.
    public List<Warehouse> findAll(Long branchId) {
        return branchId != null ? warehouseRepository.findByBranchId(branchId) : warehouseRepository.findAll();
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
        warehouse.setBranch(findBranch(dto.getBranchId()));

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
        warehouse.setBranch(findBranch(dto.getBranchId()));

        return warehouseRepository.save(warehouse);
    }

    // TAM THOI doi tu soft-delete sang xoa that (hard delete) theo yeu cau - de admin don duoc
    // du lieu test/rac khoi DB. Van chan neu dang bi tham chieu boi goods_receipt / sales_order /
    // stock / selling_zone... de khong pha rang buoc khoa ngoai. Muon quay lai soft-delete: doi
    // than ham nay ve "warehouse.setActive(false); warehouseRepository.save(warehouse);".
    @Transactional
    public void deactivate(Long id) {
        Warehouse warehouse = findById(id);
        try {
            warehouseRepository.delete(warehouse);
            warehouseRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: kho dang duoc su dung o phieu nhap/don ban/ton kho khac");
        }
    }

    private User findManager(Long managerId) {
        if (managerId == null) {
            return null;
        }
        return userRepository.findById(managerId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nguoi quan ly id=" + managerId));
    }

    private Branch findBranch(Long branchId) {
        if (branchId == null) {
            return null;
        }
        return branchRepository.findById(branchId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay chi nhanh id=" + branchId));
    }
}
