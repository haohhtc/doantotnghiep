package com.erpqlkho.backend.category.uomgroup.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uom.repository.UomRepository;
import com.erpqlkho.backend.category.uomgroup.repository.UomConversionRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

// Noi DUY NHAT quy doi DVT (Goi/Hop/Thung) ve don vi co so cua nhom quy doi - ton kho luon luu theo
// don vi co so, moi chung tu (don hang, giao hang, tra hang...) goi qua day de tinh base_quantity.
// San pham khong thuoc nhom quy doi, hoac dong khong chon DVT (uom = null) -> he so 1.
@Service
@RequiredArgsConstructor
public class UomConversionService {

    private final UomRepository uomRepository;
    private final UomConversionRepository uomConversionRepository;

    public Uom findUom(Long uomId) {
        if (uomId == null) return null;
        return uomRepository.findById(uomId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don vi tinh id=" + uomId));
    }

    public BigDecimal factorOf(Product product, Uom uom) {
        if (uom == null || product.getUomGroup() == null) return BigDecimal.ONE;
        return uomConversionRepository.findByUomGroupIdAndUomId(product.getUomGroup().getId(), uom.getId())
                .map(c -> c.getFactor())
                .orElseThrow(() -> ApiException.conflict("Don vi tinh " + uom.getName() + " khong thuoc nhom quy doi cua san pham "
                        + product.getCode()));
    }

    public BigDecimal toBase(Product product, Uom uom, BigDecimal quantity) {
        return quantity.multiply(factorOf(product, uom)).setScale(3, RoundingMode.HALF_UP);
    }
}
