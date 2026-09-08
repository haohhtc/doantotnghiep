package com.erpqlkho.backend.category.sellingzone.service;

import com.erpqlkho.backend.category.branch.entity.Branch;
import com.erpqlkho.backend.category.branch.repository.BranchRepository;
import com.erpqlkho.backend.category.sellingzone.dto.SellingZoneDto;
import com.erpqlkho.backend.category.sellingzone.entity.SellingZone;
import com.erpqlkho.backend.category.sellingzone.repository.SellingZoneRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.common.geography.GeographyResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SellingZoneService {

    private final SellingZoneRepository sellingZoneRepository;
    private final BranchRepository branchRepository;
    private final GeographyResolver geographyResolver;

    public List<SellingZone> findAll() {
        return sellingZoneRepository.findAll();
    }

    public SellingZone findById(Long id) {
        return sellingZoneRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay vung ban hang id=" + id));
    }

    @Transactional
    public SellingZone create(SellingZoneDto dto) {
        if (sellingZoneRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma vung ban hang da ton tai: " + dto.getCode());
        }

        SellingZone zone = new SellingZone();
        zone.setCode(dto.getCode());
        zone.setName(dto.getName());
        zone.setRegion(dto.getRegion());
        zone.setProvince(dto.getProvince());
        zone.setWard(dto.getWard());
        zone.setBranch(findBranch(dto.getBranchId()));
        applyGeography(zone, dto);

        return sellingZoneRepository.save(zone);
    }

    @Transactional
    public SellingZone update(Long id, SellingZoneDto dto) {
        SellingZone zone = findById(id);

        if (!zone.getCode().equals(dto.getCode()) && sellingZoneRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma vung ban hang da ton tai: " + dto.getCode());
        }

        zone.setCode(dto.getCode());
        zone.setName(dto.getName());
        zone.setRegion(dto.getRegion());
        zone.setProvince(dto.getProvince());
        zone.setWard(dto.getWard());
        zone.setBranch(findBranch(dto.getBranchId()));
        applyGeography(zone, dto);

        return sellingZoneRepository.save(zone);
    }

    // Khong co field "active" (dung thiet ke goc) - xoa han, chan neu dang bi route_master tham chieu.
    @Transactional
    public void delete(Long id) {
        SellingZone zone = findById(id);
        try {
            sellingZoneRepository.delete(zone);
            sellingZoneRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: vung ban hang dang co khung tuyen su dung");
        }
    }

    private void applyGeography(SellingZone zone, SellingZoneDto dto) {
        zone.setRegionRef(geographyResolver.resolveRegion(dto.getRegionId()));
        zone.setProvinceRef(geographyResolver.resolveProvince(dto.getProvinceId()));
        zone.setDistrictRef(geographyResolver.resolveDistrict(dto.getDistrictId()));
        zone.setWardRef(geographyResolver.resolveWard(dto.getWardId()));
    }

    private Branch findBranch(Long branchId) {
        return branchRepository.findById(branchId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay chi nhanh id=" + branchId));
    }
}
