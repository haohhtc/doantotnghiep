package com.erpqlkho.backend.category.uomgroup.service;

import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uom.repository.UomRepository;
import com.erpqlkho.backend.category.uomgroup.dto.UomConversionDto;
import com.erpqlkho.backend.category.uomgroup.dto.UomGroupDto;
import com.erpqlkho.backend.category.uomgroup.entity.UomConversion;
import com.erpqlkho.backend.category.uomgroup.entity.UomGroup;
import com.erpqlkho.backend.category.uomgroup.repository.UomConversionRepository;
import com.erpqlkho.backend.category.uomgroup.repository.UomGroupRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UomGroupService {

    private final UomGroupRepository uomGroupRepository;
    private final UomConversionRepository uomConversionRepository;
    private final UomRepository uomRepository;

    public List<UomGroup> findAll() {
        return uomGroupRepository.findAll();
    }

    public UomGroup findById(Long id) {
        return uomGroupRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nhom don vi tinh id=" + id));
    }

    @Transactional
    public UomGroup create(UomGroupDto dto) {
        if (uomGroupRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhom don vi tinh da ton tai: " + dto.getCode());
        }
        UomGroup group = new UomGroup();
        group.setCode(dto.getCode());
        group.setName(dto.getName());
        group.setBaseUom(findUom(dto.getBaseUomId()));
        return uomGroupRepository.save(group);
    }

    @Transactional
    public UomGroup update(Long id, UomGroupDto dto) {
        UomGroup group = findById(id);
        if (!group.getCode().equals(dto.getCode()) && uomGroupRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhom don vi tinh da ton tai: " + dto.getCode());
        }
        group.setCode(dto.getCode());
        group.setName(dto.getName());
        group.setBaseUom(findUom(dto.getBaseUomId()));
        return uomGroupRepository.save(group);
    }

    // Xoa that (hard delete) - chan neu dang bi product tham chieu. Xoa het cac dong quy doi
    // ben trong truoc (giong pattern RouteMaster xoa het outlet truoc khi xoa route).
    @Transactional
    public void delete(Long id) {
        UomGroup group = findById(id);
        try {
            uomConversionRepository.deleteAll(uomConversionRepository.findByUomGroupId(id));
            uomGroupRepository.delete(group);
            uomGroupRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: nhom don vi tinh dang duoc san pham khac su dung");
        }
    }

    // --- Quy doi don vi trong nhom ---

    public List<UomConversion> findConversions(Long uomGroupId) {
        findById(uomGroupId);
        return uomConversionRepository.findByUomGroupId(uomGroupId);
    }

    @Transactional
    public UomConversion addConversion(Long uomGroupId, UomConversionDto dto) {
        UomGroup group = findById(uomGroupId);
        Uom uom = findUom(dto.getUomId());

        if (uomConversionRepository.existsByUomGroupIdAndUomId(uomGroupId, dto.getUomId())) {
            throw ApiException.conflict("Don vi tinh nay da co trong nhom quy doi");
        }

        UomConversion conversion = new UomConversion();
        conversion.setUomGroup(group);
        conversion.setUom(uom);
        conversion.setFactor(dto.getFactor());
        conversion.setCreatedAt(LocalDateTime.now());
        return uomConversionRepository.save(conversion);
    }

    @Transactional
    public void removeConversion(Long uomGroupId, Long conversionId) {
        UomConversion conversion = uomConversionRepository.findById(conversionId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay dong quy doi id=" + conversionId));
        if (!conversion.getUomGroup().getId().equals(uomGroupId)) {
            throw ApiException.notFound("Dong quy doi nay khong thuoc nhom id=" + uomGroupId);
        }
        uomConversionRepository.delete(conversion);
    }

    private Uom findUom(Long id) {
        return uomRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don vi tinh id=" + id));
    }
}
