package com.erpqlkho.backend.system.service;

import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.system.dto.NumberingConfigDto;
import com.erpqlkho.backend.system.entity.NumberingConfig;
import com.erpqlkho.backend.system.repository.NumberingConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// Noi DUY NHAT sinh so phieu cho moi loai chung tu (SALES_ORDER/GOODS_RECEIPT/GOODS_ISSUE/
// INVENTORY_TRANSFER/SALES_RETURN/PURCHASE_RETURN/INVOICE/STOCK_TAKE) - thay cho tung Service tu
// hardcode tien to + dem rieng le. Cac Service hien co van tu kiem tra trung so khi nguoi dung
// nhap tay so phieu (qua existsByDocNumber cua chinh entity do) - o day chi lo phan tu sinh.
// synchronized: demo/thesis scale (1 instance), tranh 2 request cung luc sinh trung 1 so - xem
// tonghop.md muc "Quan tri" (Numbering Configs).
@Service
@RequiredArgsConstructor
public class NumberingConfigService {

    private final NumberingConfigRepository numberingConfigRepository;

    public List<NumberingConfig> findAll() {
        return numberingConfigRepository.findAll();
    }

    @Transactional
    public synchronized String nextNumber(String docType) {
        NumberingConfig config = numberingConfigRepository.findByDocType(docType)
                .orElseThrow(() -> new ApiException("Chua co cau hinh danh so cho loai chung tu: " + docType));
        config.setCurrentSequence(config.getCurrentSequence() + 1);
        config.setUpdatedAt(LocalDateTime.now());
        numberingConfigRepository.save(config);
        return config.getPrefix() + String.format("%04d", config.getCurrentSequence());
    }

    // Chi cho sua prefix - KHONG dung endpoint nay de sua current_sequence truc tiep (tranh
    // nhay so/trung so voi rang buoc UNIQUE doc_number cua tung bang).
    @Transactional
    public NumberingConfig updatePrefix(Long id, NumberingConfigDto dto) {
        NumberingConfig config = numberingConfigRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay cau hinh danh so id=" + id));
        config.setPrefix(dto.getPrefix());
        config.setUpdatedAt(LocalDateTime.now());
        return numberingConfigRepository.save(config);
    }
}
