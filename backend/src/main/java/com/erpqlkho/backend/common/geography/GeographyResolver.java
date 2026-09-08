package com.erpqlkho.backend.common.geography;

import com.erpqlkho.backend.category.district.entity.District;
import com.erpqlkho.backend.category.district.repository.DistrictRepository;
import com.erpqlkho.backend.category.province.entity.Province;
import com.erpqlkho.backend.category.province.repository.ProvinceRepository;
import com.erpqlkho.backend.category.region.entity.Region;
import com.erpqlkho.backend.category.region.repository.RegionRepository;
import com.erpqlkho.backend.category.ward.entity.Ward;
import com.erpqlkho.backend.category.ward.repository.WardRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

// Dung chung cho SellingZoneService/BranchService/CustomerService de resolve 4 FK dia ly
// (region/province/district/ward) tu id sang entity - deu la field nullable nen tra ve null
// neu id truyen vao la null (khong bat buoc phai chon dia chi theo tang).
@Component
@RequiredArgsConstructor
public class GeographyResolver {

    private final RegionRepository regionRepository;
    private final ProvinceRepository provinceRepository;
    private final DistrictRepository districtRepository;
    private final WardRepository wardRepository;

    public Region resolveRegion(Long id) {
        if (id == null) return null;
        return regionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay vung id=" + id));
    }

    public Province resolveProvince(Long id) {
        if (id == null) return null;
        return provinceRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay tinh/thanh pho id=" + id));
    }

    public District resolveDistrict(Long id) {
        if (id == null) return null;
        return districtRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay quan/huyen id=" + id));
    }

    public Ward resolveWard(Long id) {
        if (id == null) return null;
        return wardRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phuong/xa id=" + id));
    }
}
