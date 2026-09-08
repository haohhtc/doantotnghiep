package com.erpqlkho.backend.category.district.service;

import com.erpqlkho.backend.category.district.dto.DistrictDto;
import com.erpqlkho.backend.category.district.entity.District;
import com.erpqlkho.backend.category.district.repository.DistrictRepository;
import com.erpqlkho.backend.category.province.entity.Province;
import com.erpqlkho.backend.category.province.repository.ProvinceRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DistrictService {

    private final DistrictRepository districtRepository;
    private final ProvinceRepository provinceRepository;

    public List<District> findAll(Long provinceId) {
        return provinceId != null ? districtRepository.findByProvinceId(provinceId) : districtRepository.findAll();
    }

    public District findById(Long id) {
        return districtRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay quan/huyen id=" + id));
    }

    @Transactional
    public District create(DistrictDto dto) {
        if (districtRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma quan/huyen da ton tai: " + dto.getCode());
        }

        District district = new District();
        district.setCode(dto.getCode());
        district.setName(dto.getName());
        district.setProvince(findProvince(dto.getProvinceId()));

        return districtRepository.save(district);
    }

    @Transactional
    public District update(Long id, DistrictDto dto) {
        District district = findById(id);

        if (!district.getCode().equals(dto.getCode()) && districtRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma quan/huyen da ton tai: " + dto.getCode());
        }

        district.setCode(dto.getCode());
        district.setName(dto.getName());
        district.setProvince(findProvince(dto.getProvinceId()));

        return districtRepository.save(district);
    }

    // Xoa that (hard delete) - chan neu dang co Phuong/Xa hoac Chi nhanh/Vung ban hang/Khach
    // hang khac dang tham chieu, tranh pha rang buoc khoa ngoai.
    @Transactional
    public void delete(Long id) {
        District district = findById(id);
        try {
            districtRepository.delete(district);
            districtRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: quan/huyen dang co phuong/xa hoac du lieu khac su dung");
        }
    }

    private Province findProvince(Long id) {
        return provinceRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay tinh/thanh pho id=" + id));
    }
}
