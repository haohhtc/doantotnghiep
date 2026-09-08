package com.erpqlkho.backend.category.region.service;

import com.erpqlkho.backend.category.region.dto.RegionDto;
import com.erpqlkho.backend.category.region.entity.Region;
import com.erpqlkho.backend.category.region.repository.RegionRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RegionService {

    private final RegionRepository regionRepository;

    public List<Region> findAll() {
        return regionRepository.findAll();
    }

    public Region findById(Long id) {
        return regionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay vung id=" + id));
    }

    @Transactional
    public Region create(RegionDto dto) {
        if (regionRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma vung da ton tai: " + dto.getCode());
        }

        Region region = new Region();
        region.setCode(dto.getCode());
        region.setName(dto.getName());

        return regionRepository.save(region);
    }

    @Transactional
    public Region update(Long id, RegionDto dto) {
        Region region = findById(id);

        if (!region.getCode().equals(dto.getCode()) && regionRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma vung da ton tai: " + dto.getCode());
        }

        region.setCode(dto.getCode());
        region.setName(dto.getName());

        return regionRepository.save(region);
    }

    // Xoa that (hard delete) - chan neu dang co Tinh/Thanh pho hoac Chi nhanh/Vung ban hang/
    // Khach hang khac dang tham chieu, tranh pha rang buoc khoa ngoai.
    @Transactional
    public void delete(Long id) {
        Region region = findById(id);
        try {
            regionRepository.delete(region);
            regionRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: vung dang co tinh/thanh pho hoac du lieu khac su dung");
        }
    }
}
