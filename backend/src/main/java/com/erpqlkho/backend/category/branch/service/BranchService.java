package com.erpqlkho.backend.category.branch.service;

import com.erpqlkho.backend.category.branch.dto.BranchDto;
import com.erpqlkho.backend.category.branch.entity.Branch;
import com.erpqlkho.backend.category.branch.repository.BranchRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.common.geography.GeographyResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;
    private final GeographyResolver geographyResolver;

    public List<Branch> findAll() {
        return branchRepository.findAll();
    }

    public Branch findById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay chi nhanh id=" + id));
    }

    @Transactional
    public Branch create(BranchDto dto) {
        if (branchRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma chi nhanh da ton tai: " + dto.getCode());
        }

        Branch branch = new Branch();
        branch.setCode(dto.getCode());
        branch.setName(dto.getName());
        branch.setAddress(dto.getAddress());
        branch.setPhone(dto.getPhone());
        branch.setActive(dto.getActive() == null || dto.getActive());
        applyGeography(branch, dto);

        return branchRepository.save(branch);
    }

    @Transactional
    public Branch update(Long id, BranchDto dto) {
        Branch branch = findById(id);

        if (!branch.getCode().equals(dto.getCode()) && branchRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma chi nhanh da ton tai: " + dto.getCode());
        }

        branch.setCode(dto.getCode());
        branch.setName(dto.getName());
        branch.setAddress(dto.getAddress());
        branch.setPhone(dto.getPhone());
        if (dto.getActive() != null) {
            branch.setActive(dto.getActive());
        }
        applyGeography(branch, dto);

        return branchRepository.save(branch);
    }

    // TAM THOI doi tu soft-delete sang xoa that (hard delete) theo yeu cau - de admin don duoc
    // du lieu test/rac khoi DB. Van chan neu dang bi tham chieu boi selling_zone/route_master de
    // khong pha rang buoc khoa ngoai. Muon quay lai soft-delete: doi than ham nay ve
    // "branch.setActive(false); branchRepository.save(branch);".
    @Transactional
    public void deactivate(Long id) {
        Branch branch = findById(id);
        try {
            branchRepository.delete(branch);
            branchRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: chi nhanh dang duoc su dung o vung ban hang/khung tuyen khac");
        }
    }

    private void applyGeography(Branch branch, BranchDto dto) {
        branch.setRegion(geographyResolver.resolveRegion(dto.getRegionId()));
        branch.setProvince(geographyResolver.resolveProvince(dto.getProvinceId()));
        branch.setDistrict(geographyResolver.resolveDistrict(dto.getDistrictId()));
        branch.setWard(geographyResolver.resolveWard(dto.getWardId()));
    }
}
