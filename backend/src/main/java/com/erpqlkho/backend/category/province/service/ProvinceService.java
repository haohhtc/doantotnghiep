package com.erpqlkho.backend.category.province.service;

import com.erpqlkho.backend.category.province.dto.ProvinceDto;
import com.erpqlkho.backend.category.province.entity.Province;
import com.erpqlkho.backend.category.province.repository.ProvinceRepository;
import com.erpqlkho.backend.category.region.entity.Region;
import com.erpqlkho.backend.category.region.repository.RegionRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProvinceService {

    private final ProvinceRepository provinceRepository;
    private final RegionRepository regionRepository;

    public List<Province> findAll(Long regionId) {
        return regionId != null ? provinceRepository.findByRegionId(regionId) : provinceRepository.findAll();
    }

    public Province findById(Long id) {
        return provinceRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay tinh/thanh pho id=" + id));
    }

    @Transactional
    public Province create(ProvinceDto dto) {
        if (provinceRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma tinh/thanh pho da ton tai: " + dto.getCode());
        }

        Province province = new Province();
        province.setCode(dto.getCode());
        province.setName(dto.getName());
        province.setRegion(findRegion(dto.getRegionId()));

        return provinceRepository.save(province);
    }

    @Transactional
    public Province update(Long id, ProvinceDto dto) {
        Province province = findById(id);

        if (!province.getCode().equals(dto.getCode()) && provinceRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma tinh/thanh pho da ton tai: " + dto.getCode());
        }

        province.setCode(dto.getCode());
        province.setName(dto.getName());
        province.setRegion(findRegion(dto.getRegionId()));

        return provinceRepository.save(province);
    }

    // Xoa that (hard delete) - chan neu dang co Quan/Huyen hoac Chi nhanh/Vung ban hang/Khach
    // hang khac dang tham chieu, tranh pha rang buoc khoa ngoai.
    @Transactional
    public void delete(Long id) {
        Province province = findById(id);
        try {
            provinceRepository.delete(province);
            provinceRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: tinh/thanh pho dang co quan/huyen hoac du lieu khac su dung");
        }
    }

    private Region findRegion(Long id) {
        return regionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay vung id=" + id));
    }
}
