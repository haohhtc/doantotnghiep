package com.erpqlkho.backend.category.ward.service;

import com.erpqlkho.backend.category.district.entity.District;
import com.erpqlkho.backend.category.district.repository.DistrictRepository;
import com.erpqlkho.backend.category.ward.dto.WardDto;
import com.erpqlkho.backend.category.ward.entity.Ward;
import com.erpqlkho.backend.category.ward.repository.WardRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WardService {

    private final WardRepository wardRepository;
    private final DistrictRepository districtRepository;

    public List<Ward> findAll(Long districtId) {
        return districtId != null ? wardRepository.findByDistrictId(districtId) : wardRepository.findAll();
    }

    public Ward findById(Long id) {
        return wardRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phuong/xa id=" + id));
    }

    @Transactional
    public Ward create(WardDto dto) {
        if (wardRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma phuong/xa da ton tai: " + dto.getCode());
        }

        Ward ward = new Ward();
        ward.setCode(dto.getCode());
        ward.setName(dto.getName());
        ward.setDistrict(findDistrict(dto.getDistrictId()));

        return wardRepository.save(ward);
    }

    @Transactional
    public Ward update(Long id, WardDto dto) {
        Ward ward = findById(id);

        if (!ward.getCode().equals(dto.getCode()) && wardRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma phuong/xa da ton tai: " + dto.getCode());
        }

        ward.setCode(dto.getCode());
        ward.setName(dto.getName());
        ward.setDistrict(findDistrict(dto.getDistrictId()));

        return wardRepository.save(ward);
    }

    // Xoa that (hard delete) - chan neu dang bi Chi nhanh/Vung ban hang/Khach hang khac
    // tham chieu, tranh pha rang buoc khoa ngoai.
    @Transactional
    public void delete(Long id) {
        Ward ward = findById(id);
        try {
            wardRepository.delete(ward);
            wardRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: phuong/xa dang duoc du lieu khac su dung");
        }
    }

    private District findDistrict(Long id) {
        return districtRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay quan/huyen id=" + id));
    }
}
